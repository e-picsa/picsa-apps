import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class YoutubeService {
  youtube: any = {
    ready: false,
    player: null,
    playerId: null,
    videoId: null,
    videoTitle: null,
    playerHeight: "100%",
    playerWidth: "100%"
  };

  constructor() {
    this.setupPlayer();
  }

  createPlayer(videoId): void {
    const YT = window["YT"];
    this.youtube.player = YT.Player(this.youtube.playerId, {
      height: this.youtube.playerHeight,
      width: this.youtube.playerWidth,
      videoId: videoId,
      playerVars: {
        rel: 0,
        showinfo: 0,
        modestbranding: 1
      },
      events: {
        onReady: this.onPlayerReady,
        onStateChange: this.onPlayerStateChange
      }
    });
    console.log("youtube player created");
    console.log(this.youtube.player);
  }

  onPlayerReady(event) {
    event.target.playVideo();
    console.log("onPlayerReady");
  }
  onPlayerStateChange() {
    console.log("onPlayerStateChange");
  }

  loadPlayer(): void {
    if (this.youtube.ready && this.youtube.playerId) {
      if (this.youtube.player) {
        this.youtube.player.destroy();
      }
      this.youtube.player = this.createPlayer("M7lc1UVf-VE");
    }
  }

  setupPlayer() {
    console.log("Running Setup Player");
    window["onYouTubeIframeAPIReady"] = () => {
      if (window["YT"]) {
        console.log("Youtube API is ready");
        this.youtube.ready = true;
        this.youtube.playerId = "placeholder";
        this.loadPlayer();
      }
    };
    // if (window.YT && window.YT.Player) {
    //         console.log('Youtube Player is ready');
    //      this.youtube.ready = true;
    //      this.youtube.playerId = 'placeholder';
    //      this.loadPlayer();
    // }
  }

  launchPlayer(id, title): void {
    this.createPlayer(id.videoId);
  }
}
