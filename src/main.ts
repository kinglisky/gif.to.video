import { setupFFmpegTranscode } from './ffmpeg-transcode';
import { setupFFmpegMergeFrames } from './ffmpeg-merge-frames';
import { setupParseGifToWebm } from './gifuct-to-webm';
import { setupImageDecodeWriteWebm } from './image-decode-webm-writer';
import { setupImageDecodeMuxWebm } from './image-decode-webm-muxer';

import gifList from './gif-list';
import appHTML from './app.html?raw';
import './style.css';

(async function startup() {
    document.querySelector<HTMLDivElement>('#app')!.innerHTML = appHTML;

    const createSelector = () => {
        const options = gifList.map(
            (item) => `<option value="${item.url}">${item.name}</option>`
        );
        return `图片选择：<select id="gif-selector">${options.join(
            ''
        )}</select>`;
    };

    document.querySelector<HTMLDivElement>(
        '#gif-selector-container'
    )!.innerHTML = createSelector();

    const gifSelector =
        document.querySelector<HTMLSelectElement>('#gif-selector')!;

    const inputGif = document.querySelector<HTMLImageElement>('#input-gif')!;
    const videos = document.querySelectorAll<HTMLVideoElement>('video');
    const infos = document.querySelectorAll<HTMLSpanElement>('.item-info-text');

    const updateInputGif = (url: string) => {
        inputGif.src = url;
        videos.forEach((video) => (video.src = ''));
        infos.forEach((info) => (info.innerText = ''));
    };

    updateInputGif(gifList[0].url);
    gifSelector.addEventListener('change', (event) => {
        // @ts-ignore
        updateInputGif(event.target!.value);
    });

    /**
     * FFmepg 直接转码
     */
    setupFFmpegTranscode({
        inputGif,
        button: document.querySelector<HTMLButtonElement>(
            '#ffmpeg-transcode-btn'
        )!,
        video: document.querySelector<HTMLVideoElement>(
            '#ffmpeg-transcode-video'
        )!,
        time: document.querySelector<HTMLSpanElement>(
            '#ffmpeg-transcode-time'
        )!,
    });

    /**
     * 解析 Gif 图片帧后由 FFmepg 合成视频
     */
    setupFFmpegMergeFrames({
        inputGif,
        button: document.querySelector<HTMLButtonElement>(
            '#ffmpeg-frames-btn'
        )!,
        video: document.querySelector<HTMLVideoElement>(
            '#ffmpeg-frames-video'
        )!,
        time: document.querySelector<HTMLSpanElement>('#ffmpeg-frames-time')!,
    });

    /**
     * 解析 Gif 图片然后由 webm-writer 生成 webM 视频
     */
    setupParseGifToWebm({
        inputGif,
        button: document.querySelector<HTMLButtonElement>('#parse-gif-btn')!,
        video: document.querySelector<HTMLVideoElement>('#parse-gif-video')!,
        time: document.querySelector<HTMLSpanElement>('#parse-gif-time')!,
    });

    /**
     * 使用 ImageDecoder 解析 Gif 图片然后由 webm-writer 生成 webM 视频
     */
    setupImageDecodeWriteWebm({
        inputGif,
        button: document.querySelector<HTMLButtonElement>('#web-codecs-btn')!,
        video: document.querySelector<HTMLVideoElement>('#web-codecs-video')!,
        time: document.querySelector<HTMLSpanElement>('#web-codecs-time')!,
    });

    /**
     * 使用 ImageDecoder 解析 Gif 图片然后由 webm-muxer 生成 webM 视频
     */
    setupImageDecodeMuxWebm({
        inputGif,
        button: document.querySelector<HTMLButtonElement>(
            '#web-codecs-mux-btn'
        )!,
        video: document.querySelector<HTMLVideoElement>(
            '#web-codecs-mux-video'
        )!,
        time: document.querySelector<HTMLSpanElement>('#web-codecs-mux-time')!,
    });
})();
