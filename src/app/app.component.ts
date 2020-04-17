import { Component, NgZone, ViewChild, OnInit } from "@angular/core";
import { SignaturePad } from "angular2-signaturepad/signature-pad";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"]
})
export class AppComponent implements OnInit {
  peer;
  roomid;
  conn;
  data = "";
  @ViewChild(SignaturePad) signaturePad: SignaturePad;
  isClient = false;

  private signaturePadOptions: Object = {
    // passed through to szimek/signature_pad constructor
    minWidth: 5,
    canvasWidth: 300,
    canvasHeight: 300
  };

  getPath() {
    return window.location.href + "#" + this.peer.id;
  }
  clear() {
    this.signaturePad.clear();
  }

  constructor(private ngZone: NgZone) {
    let hash = window.location.hash;

    if (hash) {
      this.isClient = true;
      this.roomid = hash.replace("#", "");
      this.joinRoom();
    }
  }
  createRoom() {
    this.peer = new Peer({
      config: { iceServers: [{ url: "stun:stun.l.google.com:19302" }] }
    });
    this.signaturePad.off();

    this.peer.on(
      "call",
      function(call) {
        navigator.getUserMedia(
          { video: true, audio: false },
          function(stream) {
            call.answer(stream); // Answer the call with an A/V stream.
            let video: any = document.getElementById("videoElementLocal");
            video.srcObject = stream;
            video.play();

            call.on(
              "stream",
              function(remoteStream) {
                // Show stream in some video/canvas element.
                //his.videoRemote.srcObject = remoteStream;
                //this.videoRemote.play();
                console.log("recieve call");
                let video: any = document.getElementById("videoElementRemote");
                video.srcObject = remoteStream;
                video.play();
                //this.videoRemote.srcObject = remoteStream;
                //this.videoRemote.play();
              },
              this
            );
          },
          function(err) {
            console.log("Failed to get local stream", err);
          }
        );
      },
      this
    );
    this.peer.on(
      "connection",
      function(conn) {
        this.conn = conn;
        conn.on(
          "data",
          function(data) {
            this.ngZone.run(() => {
              this.data = data;
              console.log(this.signaturePad);
              this.signaturePad.fromDataURL(this.data);
            });
          },
          this
        );
      },
      this
    );
  }

  makeACall() {
    navigator.getUserMedia(
      { video: true, audio: false },
      stream => {
        console.log("Start call");
        let video: any = document.getElementById("videoElementLocal");
        video.srcObject = stream;
        video.play();
        var call = this.peer.call(this.roomid, stream);
        call.on(
          "stream",
          function(remoteStream) {
            // Show stream in some video/canvas element.
            let video: any = document.getElementById("videoElementRemote");
            video.srcObject = remoteStream;
            video.play();
          },
          this
        );
      },
      () => {}
    );
  }
  joinRoom() {
    this.peer = new Peer({
      config: { iceServers: [{ url: "stun:stun.l.google.com:19302" }] }
    });
    this.conn = this.peer.connect(this.roomid);
    this.peer.on(
      "connection",
      function(conn) {
        conn.on("data", data => {
          this.data = data;
        });
      },
      this
    );
  }

  drawComplete() {
    // will be notified of szimek/signature_pad's onEnd event
    if (this.conn) {
      this.conn.send(this.signaturePad.toDataURL());
    }
  }
}
