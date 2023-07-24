import { Component, Input, OnDestroy,OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { IManualActivity, PICSA_MANUAL_GRID_DATA } from '../../data/manual-contents';
import { setVideoPlayer } from '../../utils/video-player';

@Component({
  selector: 'picsa-manual-activity-details',
  templateUrl: './activity-details.component.html',
  styleUrls: ['./activity-details.component.scss'],
})
export class ActivityDetailsComponent implements OnInit, OnDestroy {
  activity?: IManualActivity;
  @Input() url: string;
  @Input() sturl: string;
  @Input() stlang: string;
  @Input() stoptions: any;
  @Input() rate: number;
  @Input() exitOnEnd: boolean;
  @Input() loopOnEnd: boolean;
  @Input() pipEnabled: boolean;
  @Input() bkmodeEnabled: boolean;
  @Input() showControls: boolean;
  @Input() displayMode: string;
  @Input() testApi: boolean;
  @Input() platform: string;

  private videoPlayer: any;

  //most of the code commented out is concerned with listeners
  // Todo: determine if it will be required or not

  // private handlerPlay: any;
  // private handlerPause: any;
  // private handlerEnded: any;
  // private handlerReady: any;
  // private handlerPlaying: any;
  // private handlerExit: any;
  private first = false;

  // private mSturl: string = null;
  // private mStlang: string = null;

  // private apiTimer1: any;
  // private apiTimer2: any;
  // private apiTimer3: any;

  private mUrl: any = null;
  private mStoptions: any = null;
  private mRate = 1.0;
  private mExitOnEnd = true;
  private mLoopOnEnd = false;
  private mPipEnabled = true;
  private mBkmodeEnabled = true;
  private mShowControls = true;
  private mDisplayMode = 'portrait';
  private mTestApi: boolean;

  constructor(private route: ActivatedRoute) {}
  async ngOnInit() {
    const activityId = this.route.snapshot.params.id;
    if (activityId) {
      this.activity = PICSA_MANUAL_GRID_DATA.find((activity) => activity.id === activityId);
    }
    this.mTestApi = this.testApi ? this.testApi : false;
    const player: any = await setVideoPlayer();
    
    this.videoPlayer = player.plugin;

    await this.intiateVideoPlayer()
    
    //await this.addListenersToPlayerPlugin();
  }
  async intiateVideoPlayer() {
    this.mUrl = this.activity?.video;
    this.mStoptions = this.stoptions;
    this.mRate = this.rate;
    this.mExitOnEnd = this.exitOnEnd;
    this.mLoopOnEnd = this.loopOnEnd;
    this.mPipEnabled = this.pipEnabled;
    this.mBkmodeEnabled = this.bkmodeEnabled;
    this.mShowControls = this.showControls;
    this.mDisplayMode = this.displayMode;
    if (this.mUrl != null && this.mUrl != undefined) {
      if (this.mTestApi) {
        this.first = true;
      }
      const res: any = await this.videoPlayer.initPlayer({
        mode: 'embedded',// or fullscreen (2 modes)
        url: this.mUrl,
        subtitleOptions: this.mStoptions,
        playerId: 'video-player',
        rate: this.mRate,
        exitOnEnd: this.mExitOnEnd,
        loopOnEnd: this.mLoopOnEnd,
        pipEnabled: this.mPipEnabled,
        bkmodeEnabled: this.mBkmodeEnabled,
        showControls: this.mShowControls,
        displayMode: this.mDisplayMode,
        componentTag: 'picsa-manual-activity-details',
      });
      console.log(`res ${JSON.stringify(res)}`);
      if (!res.result && (this.platform === 'ios' || this.platform === 'android')) {
        console.log(res.message);
      }
      console.log('res.result ', res.result);
      if (!res.result) {
        console.log(`res.message ${res.message}`);
      }
    }
  }
  // private async addListenersToPlayerPlugin(): Promise<void> {
  //   this.handlerPlay = await this.videoPlayer.addListener(
  //     'jeepCapVideoPlayerPlay',
  //     (data: any) => this.playerPlay(data),
  //     false
  //   );
  //   this.handlerPause = await this.videoPlayer.addListener(
  //     'jeepCapVideoPlayerPause',
  //     (data: any) => this.playerPause(data),
  //     false
  //   );
  //   this.handlerEnded = await this.videoPlayer.addListener(
  //     'jeepCapVideoPlayerEnded',
  //     (data: any) => this.playerEnd(data),
  //     false
  //   );
  //   this.handlerExit = await this.videoPlayer.addListener(
  //     'jeepCapVideoPlayerExit',
  //     (data: any) => this.playerExit(data),
  //     false
  //   );
  //   this.handlerReady = await this.videoPlayer.addListener(
  //     'jeepCapVideoPlayerReady',
  //     async (data: any) => this.playerReady(data),
  //     false
  //   );
  //   return;
  // }
  // private async playerPlay(data: any): Promise<void> {
  //   return;
  // }
  // private async playerPause(data: any): Promise<void> {
  //   return;
  // }
  // private async playerEnd(data: any): Promise<void> {
  //   return;
  // }
  // private async playerExit(data: any): Promise<void> {
  //   return;
  // }
  // private async playerReady(data: any): Promise<void> {
  //   console.log(`Event jeepCapVideoPlayerReady ${data}`);
  //   console.log(`testVideoPlayerPlugin testAPI ${this.mTestApi}`);
  //   console.log(`testVideoPlayerPlugin first ${this.first}`);
  //   if (this.mTestApi && this.first) {
  //     // test the API
  //     this.first = false;
  //     console.log('testVideoPlayerPlugin calling isPlaying ');
  //     let isPlaying = await this.videoPlayer.isPlaying({ playerId: 'fullscreen' });
  //     console.log(` isPlaying ${isPlaying}`);
  //     this.apiTimer1 = setTimeout(async () => {
  //       let pause = await this.videoPlayer.pause({ playerId: 'fullscreen' });
  //       console.log(`pause ${pause}`);
  //       let retRate: any = await this.videoPlayer.getRate({ playerId: 'fullscreen' });
  //       console.log(`rate ${retRate.value}`);
  //       retRate = await this.videoPlayer.setRate({ playerId: 'fullscreen', rate: 0.5 });
  //       console.log(`new rate ${retRate.value}`);
  //       isPlaying = await this.videoPlayer.isPlaying({ playerId: 'fullscreen' });
  //       console.log(`const isPlaying after pause ${isPlaying}`);
  //       const currentTime = await this.videoPlayer.getCurrentTime({ playerId: 'fullscreen' });
  //       console.log('const currentTime ', currentTime);
  //       let muted = await this.videoPlayer.getMuted({ playerId: 'fullscreen' });
  //       if (muted.value) {
  //         console.log('getMuted true');
  //       } else {
  //         console.log('getMuted false');
  //       }
  //       let setMuted = await this.videoPlayer.setMuted({ playerId: 'fullscreen', muted: !muted.value });
  //       if (setMuted.value) {
  //         console.log('setMuted true');
  //       } else {
  //         console.log('setMuted false');
  //       }
  //       muted = await this.videoPlayer.getMuted({ playerId: 'fullscreen' });
  //       if (muted.value) {
  //         console.log('getMuted true');
  //       } else {
  //         console.log('getMuted false');
  //       }
  //       let duration = await this.videoPlayer.getDuration({ playerId: 'fullscreen' });
  //       console.log(`duration ${duration}`);
  //       // valid for movies havin a duration > 25
  //       const seektime =
  //         currentTime.value + 0.5 * duration.value < duration.value - 25
  //           ? currentTime.value + 0.5 * duration.value
  //           : duration.value - 25;
  //       let setCurrentTime = await this.videoPlayer.setCurrentTime({ playerId: 'fullscreen', seektime });
  //       console.log('setCurrentTime ', setCurrentTime.value);
  //       let play = await this.videoPlayer.play({ playerId: 'fullscreen' });
  //       console.log(`$$$ play ${play}`);
  //       retRate = await this.videoPlayer.getRate({ playerId: 'fullscreen' });
  //       console.log(`$$$ rate ${retRate.value}`);
  //       this.apiTimer2 = setTimeout(async () => {
  //         setMuted = await this.videoPlayer.setMuted({ playerId: 'fullscreen', muted: false });
  //         console.log('setMuted ', setMuted);
  //         const setVolume = await this.videoPlayer.setVolume({ playerId: 'fullscreen', volume: 0.5 });
  //         console.log(`setVolume ${setVolume}`);
  //         let volume = await this.videoPlayer.getVolume({ playerId: 'fullscreen' });
  //         console.log(`Volume ${volume}`);
  //         this.apiTimer3 = setTimeout(async () => {
  //           pause = await this.videoPlayer.pause({ playerId: 'fullscreen' });
  //           console.log('const pause ', pause);
  //           duration = await this.videoPlayer.getDuration({ playerId: 'fullscreen' });
  //           console.log(`duration ${duration}`);
  //           volume = await this.videoPlayer.setVolume({ playerId: 'fullscreen', volume: 1.0 });
  //           console.log(`Volume ${volume}`);
  //           setCurrentTime = await this.videoPlayer.setCurrentTime({
  //             playerId: 'fullscreen',
  //             seektime: duration.value - 3,
  //           });
  //           console.log(`setCurrentTime ${setCurrentTime}`);
  //           play = await this.videoPlayer.play({ playerId: 'fullscreen' });
  //           console.log(`xxx play ${play}`);
  //           retRate = await this.videoPlayer.getRate({ playerId: 'fullscreen' });
  //           console.log(`xxx rate ${retRate.value}`);
  //         }, 10000);
  //       }, 8000);
  //     }, 7000);
  //   }
  //   return;
  // }

  
  async ngOnDestroy() {
    const res: any  = await this.videoPlayer.stopAllPlayers();
    // clearTimeout(this.apiTimer3);
    // clearTimeout(this.apiTimer2);
    // clearTimeout(this.apiTimer1);
    // this.handlerPlay.remove();
    // this.handlerPause.remove();
    // this.handlerEnded.remove();
    // this.handlerReady.remove();
    // this.handlerPlaying.remove();
    // this.handlerExit.remove();
}
}
