import { Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output, } from '@angular/core';
import { RxAttachment} from 'rxdb';
import { IResourceFile } from '../../schemas';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { FileService } from '@picsa/shared/services/core/file.service';


type IDownloadStatus = 'ready' | 'pending' | 'complete' | 'error';

@Component({
  selector: 'picsa-resource-download-multiple',
  templateUrl: './resource-download-multiple.component.html',
  styleUrl: './resource-download-multiple.component.scss',
})

export class ResourceDownloadMultipleComponent implements OnDestroy {
    private _dbDoc: IResourceFile[] =[];
    public attachment?: RxAttachment<IResourceFile>;
    
     downloadStatus: IDownloadStatus = 'ready';
     downloadProgress = 0;
    totalSize = 0;
    totalSizeMB = 0;
  
    private componentDestroyed$ = new Subject();
    private downloadSubscription?: Subscription;

    @Output() downloadCompleted = new EventEmitter<void>();

    @Input() styleVariant: 'primary' | 'white' = 'primary';

    @Input() size = 48;

    @Input() hideOnComplete = false;

    @Input() set dbDoc(dbDoc: IResourceFile[]) {
      this._dbDoc = dbDoc;
      }
    
    
    constructor(
      private fileService: FileService,
    ) {}
  
    public get sizePx() {
      return `${this.size}px`;
    }
  
    public get resource() {
      return this._dbDoc
      ;
    }

    ngOnInit(): void {
      this.calculateTotalSize();
    }

    ngOnDestroy(): void {
      this.componentDestroyed$.next(true);
      this.componentDestroyed$.complete();
    }
  
    public calculateTotalSize(): void {
      if (!this._dbDoc || this._dbDoc.length === 0) {
        console.log('No resources available');
        return;
      }
      
      this.totalSize = this._dbDoc.reduce((acc, doc) => acc + doc.size_kb, 0);
      const totalSizeMB = this.totalSize / 1024;
      this.totalSizeMB = +totalSizeMB.toFixed(2);
    }
  
    public downloadAllResources(): void {
      this.downloadStatus = 'pending';
      this.downloadProgress = 0;
  
      const downloadQueue = [...this.resource];
      const downloadNext = () => {
        if (downloadQueue.length === 0) {
          this.downloadStatus = 'complete';
          this.downloadCompleted.emit();
          return;
        }
  
        const resource = downloadQueue.shift();
        if (resource) {
          this.fileService.downloadFile(resource.url, 'blob').subscribe({
            next: ({ progress }) => {
              this.downloadProgress = progress;
            },
            error: (error) => {
              this.downloadStatus = 'error';
              console.error(error);
            },
            complete: () => {
              downloadNext();
            }
          });
        }
      };
  
      downloadNext();
    }
  
    public cancelDownload(): void {
      if (this.downloadSubscription) {
        this.downloadSubscription.unsubscribe();
        this.downloadSubscription = undefined;
      }
      this.downloadStatus = 'ready';
      this.downloadProgress = 0;
    }
  }

