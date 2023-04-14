# ffmepg.wasm 与 webCodecs gif 转码性能对比

## 示例

https://gif-to-wasm-video.vercel.app 貌似需要翻墙了

## 实现

see: [聊聊基于 WebCodecs 实现 GIF 的视频转码](./doc.md)

## 开发

```bash
pnpm i
pnpm run dev
```

## 资料
- [视频和音频内容 - 学习 Web 开发 | MDN](https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content)
- [WebCodecs API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [ImageDecoder - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder)
- [VideoEncoder - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder)
- [https://github.com/ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [GitHub - thenickdude/webm-writer-js: JavaScript-based WebM video encoder for Google Chrome](https://github.com/thenickdude/webm-writer-js)
- [GitHub - Vanilagy/webm-muxer: WebM multiplexer in pure TypeScript with support for WebCodecs API, video & audio.](https://github.com/Vanilagy/webm-muxer)
- [WebCodecs > VideoEncoder: Create video from encoded frames](https://stackoverflow.com/questions/70313774/webcodecs-videoencoder-create-video-from-encoded-frames)