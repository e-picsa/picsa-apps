import { select } from "@angular-redux/store";
import { Injectable, OnDestroy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { UserActions } from "../actions/user.actions";
import { IFormResponse, IUser } from "../models/models";
import { APP_VERSION } from "src/environments/version";
// unsure why, but can't import both from ./providers - not a big issue
import { FileService } from "./file-service";
import { FirestoreStorageProvider } from "./firestore";
import { StorageProvider } from "./storage";
import { TranslationsProvider } from "./translations";

@Injectable({ providedIn: "root" })
export class UserProvider implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  user: IUser;
  @select("user") user$: Observable<IUser>;
  @select(["user", "lang"])
  readonly lang$: Observable<string>;
  constructor(
    private afAuth: AngularFireAuth,
    private storagePrvdr: StorageProvider,
    private actions: UserActions,
    private firestorePrvdr: FirestoreStorageProvider,
    private translate: TranslateService,
    private filePrvdr: FileService,
    private utils: TranslationsProvider
  ) {}

  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }
  async init() {
    console.log("user init");
    this.initTranslate();
    await this.loadUser();
    await this.enableUserSync();
    this.firestorePrvdr.syncCollections();
    this.subscribeToFirebaseChanges();
  }

  initTranslate() {
    this.translate.setDefaultLang("en");
    this.lang$.pipe(takeUntil(this.componentDestroyed)).subscribe(lang => {
      if (lang) {
        this.changeLanguage(lang);
      }
    });
  }

  // load user doc from storage on init and reflect to redux
  // additionally checks for user backup
  async loadUser() {
    const user: IUser = await this.storagePrvdr.get("user");
    console.log("user loaded", user);
    if (user) {
      this.setUser(user);
      this.presentToast("user loaded successfully");
    } else {
      // no user, see if a backup exists on file if using mobile
      if (this.filePrvdr.isCordova) {
        const userBackup = await this._checkIfUserBackupExists();
        if (userBackup) {
          this.setUser(userBackup);
          this.presentToast("user restored successfully");
          return;
        }
        // if no backup let's initialise a new user so that user object exists to store data on
        else {
          this.createNewUser();
        }
      } else {
        this.createNewUser();
      }
    }
  }

  // additional set user used primarly during user load and backup
  setUser(user: IUser) {
    this.user = user;
    this.storagePrvdr.set("user", user);
    this.actions.updateUser(user);
  }

  createNewUser() {
    const user: IUser = {
      lang: "en",
      appVersion: APP_VERSION.text
    };
    this.setUser(user);
    this.presentToast("user profile created");
  }

  // automatically reflect changes to user to local storage and firebase
  // note - only want to sync if user authenticated (i.e logged in via email or joined group)
  async enableUserSync() {
    this.user$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(async user => {
        this.user = user;
        if (user) {
          await this.storagePrvdr.set("user", user);
          if (user && user.authenticated) {
            this.firestorePrvdr.setDoc(`users/${user.id}`, user);
          }
          if (this.filePrvdr.isCordova) {
            this._backupUserToDisk();
          }
        }
      });
  }

  async _backupUserToDisk() {
    await this.filePrvdr.createFile(
      "picsaUserBackup.txt",
      this.user,
      true,
      true
    );
    return;
  }

  async _checkIfUserBackupExists() {
    const fileTxt = await this.filePrvdr.readTextFile(
      "picsaUserBackup.txt",
      true
    );
    if (fileTxt) {
      const user: IUser = JSON.parse(fileTxt);
      return user;
    }
    return null;
  }

  // present toast with timeout to allow content to be fully registered
  async presentToast(msg: string) {
    const toast = await this.utils.createTranslatedToast(
      {
        duration: 2000,
        position: "bottom",
        message: msg
      },
      500
    );
    await toast.present();
  }

  changeLanguage(code: string) {
    this.translate.use(code);
  }

  // joinGroup() {}

  // set user doc
  updateUser(userFieldKey, value) {
    const user = this.user;
    user[userFieldKey] = value;
    this.actions.updateUser(user);
  }

  saveFormResponse(formID: string, response: IFormResponse) {
    const user = this.user;
    if (!user.submittedForms) {
      user.submittedForms = {};
    }
    if (!user.submittedForms[formID]) {
      user.submittedForms[formID] = {};
    }
    user.submittedForms[formID][response._key] = response;
    this.actions.updateUser(user);
  }

  subscribeToFirebaseChanges() {
    // wrap in try-catch as sometimes throws error if offline and trying to refresh token
    try {
      this.afAuth.auth.onAuthStateChanged(user => {
        if (user) {
          // User is signed in.
          this.actions.updateUser({
            id: user.uid,
            email: user.email,
            verified: user.emailVerified
          });
        } else {
          // User is signed out.
        }
      });
    } catch (error) {
      console.error(error);
    }
  }
}
