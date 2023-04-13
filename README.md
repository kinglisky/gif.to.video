# ffmepg.wasm 与 webCodecs gif 转码性能对比

## 示例

https://gif-to-wasm-video.vercel.app 貌似胡需要翻墙了

## 开发

```bash
pnpm i
pnpm run dev
```

## 资料
- https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API
- https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder
- https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder
- https://github.com/thenickdude/webm-writer-js
- https://github.com/Vanilagy/webm-muxer
- https://stackoverflow.com/questions/70313774/webcodecs-videoencoder-create-video-from-encoded-frames
- https://github.com/Vanilagy/webm-muxer/issues/9 webM alpha 通道问题