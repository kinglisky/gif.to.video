import './style.css';
import gifURL from '/nichijo.gif';
import { setupFFmpegTranscode } from './ffmpeg';
import { setupWebCodecsTranscode } from './web-codecs';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="container">
    <div class="item-container">
      <img src="${gifURL}"/>
    </div>
    <div class="item-container">
      <video id="ffmpeg-transcode-video" loop muted autoplay></video>
      <div class="item-info">
        <button id="ffmpeg-transcode-btn">FFmepg 转码</button>
        <p id="ffmpeg-transcode-time">用时：---</p>
      </div>
    </div>
    <div class="item-container">
      <video id="web-codecs-transcode-video" loop muted autoplay></video>
      <div class="item-info">
        <button id="web-codecs-transcode-btn">WebCodecs 转码</button>
        <p id="web-codecs-transcode-time">用时：---</p>
      </div>
    </div>
  </div>
`;

setupFFmpegTranscode({
    gifURL: gifURL,
    button: document.querySelector<HTMLButtonElement>('#ffmpeg-transcode-btn')!,
    video: document.querySelector<HTMLVideoElement>('#ffmpeg-transcode-video')!,
    time: document.querySelector<HTMLSpanElement>('#ffmpeg-transcode-time')!,
});

setupWebCodecsTranscode({
    gifURL: gifURL,
    button: document.querySelector<HTMLButtonElement>(
        '#web-codecs-transcode-btn'
    )!,
    video: document.querySelector<HTMLVideoElement>(
        '#web-codecs-transcode-video'
    )!,
    time: document.querySelector<HTMLSpanElement>(
        '#web-codecs-transcode-time'
    )!,
});
