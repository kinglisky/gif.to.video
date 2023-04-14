<a name="sSb66"></a>
## 楔子
GIF 承载着微信各种沙雕表情包，看到了可能乐呵一下，但工作上碰到 GIF 资源处理却是一个很棘手的问题。相较于半只腿已经迈进坟墓的 GIF 图片，视频是一个很好的替代载体，对比 GIF 图片有着**更小的体积**、**更好的画质**与**资源加载速度的提升**，但现实终归会来恶心你一下，聊聊这次遇到的问题。<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681287724487-922095d5-0bca-476d-8af0-28d9f74511ab.png#averageHue=%23c1cbc4&clientId=u61f8a4a9-60d4-4&from=paste&height=1165&id=u3ba19692&name=image.png&originHeight=1165&originWidth=2172&originalType=binary&ratio=1&rotation=0&showTitle=false&size=907244&status=done&style=none&taskId=ub0aecdf8-dc19-4607-a61c-12320731631&title=&width=2172)<br />画面左侧 Canvas 是 [Cocos Creator](https://docs.cocos.com/) 引擎场景渲染区域，业务功能上需要将摄像头画面、视频与 GIF 资源转换成视频[媒体流](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaStream)，提供给引擎使用，引擎逐帧捕获媒体流画面将其作画面的背景元素使用。摄像头与视频资源可以很方便的通过 Web API 创建媒体流：

- 摄像头通过 [MediaDevices.getUserMedia()](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaDevices/getUserMedia) 创建
- 视频通过 video 元素 [HTMLMediaElement: captureStream()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream) 创建

而 GIF 没法直接创建媒体流资源，需要将 GIF 转换成视频流使用，有两个思路：

- 将 GIF 直接转成视频再通过  [HTMLMediaElement: captureStream()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/captureStream) 创建视频流
- 解析 GIF 图片逐帧绘制到 Canvas 在通过[ HTMLCanvasElement.captureStream()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/captureStream) 创建视频流

Canvas 元素一样实现了 HTMLMediaElement 元素的 captureStream 接口，可用于实时捕获 Cavnas 内容。将 GIF 逐帧绘制到 Canvas 上本质还是实现 GIF 的播放，需要考虑到绘制帧率控制与循环播放，不如直接使用视频来的方便，所以问题的核心就变为：如何在 Web 环境将 GIF 转换成视频资源？

简单验证了几种浏览器 GIF 视频转码方案，用 [WebCodecs API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebCodecs_API) 转码 GIF 算是一种较优方案，简单做个梳理。<br />附：

- 仓库地址：[https://github.com/kinglisky/gif.to.video](https://github.com/kinglisky/gif.to.video)
- 在线 demo: [https://gif-to-wasm-video.vercel.app](https://gif-to-wasm-video.vercel.app) (vercel 貌似需要翻墙了)
<a name="eoMiS"></a>
## FFmpeg 实现 GIF 转码
> **FFmpeg** 是一个[开放源代码](https://zh.wikipedia.org/wiki/%E9%96%8B%E6%94%BE%E5%8E%9F%E5%A7%8B%E7%A2%BC)的自由软件，可以执行音频和视频多种格式的录影、转换、串流功能[[7]](https://zh.wikipedia.org/wiki/FFmpeg#cite_note-7)，包含了[libavcodec](https://zh.wikipedia.org/wiki/Libavcodec)——这是一个用于多个项目中音频和视频的解码器库，以及libavformat——一个音频与视频格式转换库。


**视频**、**转码**这两关键字一出用 [FFmpeg](https://ffmpeg.org/) 就错不了，这里不赘述 FFmpeg 的使用，使用 FFmpeg 将 GIF 转成视频是一件很简单的事：
```bash
ffmpeg -i input.gif -row-mt 1 -vf pad=ceil(iw/2)*2:ceil(ih/2)*2 -movflags faststart -pix_fmt yuva420p output.webm
```

**-i input.gif**: **-i **表示输入文件，这里的输入文件是 **input.gif** 。

**-row-mt 1**：这是一个编码选项，它启用了 FFmpeg 的多线程（row-based multithreading）功能。这可以提高编码速度，特别是在处理高分辨率视频时。

**-vf pad=ceil(iw/2)*2:ceil(ih/2)*2**: **-vf **表示视频过滤器，**pad **是一个视频过滤器，用于调整视频画面的尺寸。**ceil(iw/2)*2:ceil(ih/2)*2 **是两个参数，分别表示新的宽度和高度。**ceil(iw/2)*2 **和 **ceil(ih/2)*2 **的计算方式是将输入视频的宽度和高度除以 2，然后向上取整（**ceil **函数），再乘以 2。这样做的目的是确保视频的宽度和高度都是偶数，这对于某些编码器是必需的。

**-movflags faststart**: **-movflags **表示设置输出文件的特定标志。**faststart **表示将文件的 moov 原子移动到文件的开始，以便在网络上快速开始播放。

**-pix_fmt yuva420p**: **-pix_fmt **用于设置像素格式。**yuva420p **是一种支持alpha通道（透明度）的像素格式，这对于保留 GIF 的透明度很重要。此格式使用 YUV 颜色空间，并具有 4:2:0 的色度子采样。

**output.webm**: 这是输出文件，因为是在浏览器中播放视频，所以转成 WebM 格式。

由于引擎对于捕获的媒体流图片有要求，需要**保证图片的宽高为偶数**，像素格式为 **yuva420p** 是为了保留 GIF 图片的**透明度信息**，如果不需要保留透明度信息使用 **yuv420p** 即可。

![input.gif](https://cdn.nlark.com/yuque/0/2023/gif/1039081/1681298494187-67e35b2e-3df5-4172-af58-3036b774131b.gif#averageHue=%23adaa6e&clientId=u1cd53d13-13aa-4&from=paste&height=281&id=ua1efe695&name=input.gif&originHeight=281&originWidth=500&originalType=binary&ratio=1&rotation=0&showTitle=true&size=2004107&status=done&style=none&taskId=uce864799-6550-4a38-8831-521329baddd&title=input.gif&width=500 "input.gif")<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681298811717-bf3867eb-75b0-44ee-9745-b2ae483405d7.png#averageHue=%230f0f0f&clientId=u1cd53d13-13aa-4&from=paste&height=183&id=fLUCM&name=image.png&originHeight=183&originWidth=881&originalType=binary&ratio=1&rotation=0&showTitle=false&size=29766&status=done&style=none&taskId=u9a5c30c3-a4ed-4f92-98a8-736ff74f0fd&title=&width=881)<br />上述 4s 的 GIF 图片转码成 WebM 视频后体积直接由 1.9M 降到了 309K，越大的 GIF 图片转视频效果越明显。顺便测试了下转成 WebP 的体积，也远远小于 GIF 图片。
```bash
ffmepg -i input.gif -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" -movflags faststart -pix_fmt yuva420p -loop 0 output.webp
```
注：转 WebP 时加了个 **-loop 0 **用于保证动图的循环播放。<br />![output.webp](https://cdn.nlark.com/yuque/0/2023/webp/1039081/1681299318939-b4f63dc1-9969-4b39-9f9b-0e45b1046fe7.webp#clientId=ua71a4f0c-9664-4&from=paste&height=282&id=u8eeaa364&name=output.webp&originHeight=282&originWidth=500&originalType=binary&ratio=1&rotation=0&showTitle=true&size=827774&status=done&style=none&taskId=u25abe53b-be00-4341-8dec-f1b779321b2&title=output.webp&width=500 "output.webp")<br />FFmpeg GIF 转码不是什么问题，问题是 FFmpeg 没法在浏览器中直接使用，在浏览器直接复用现有工具能力无非是找找对应 WebAssembly 版本的实现。比较好用的 FFmpeg WebAssembly 实现就是 [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)  了。基于 ffmpeg.wasm 在浏览器环境实现转码也很简单，与直接使用 FFmpeg 区别为 wasm 版本将文件内容写入到虚拟文件系统而已：
```typescript
import { createFFmpeg } from '@ffmpeg/ffmpeg';
import { fetchArrayBuffer } from './utils';

const corePath = `/ffmpeg/ffmpeg-core.js`;
const workerPath = `/ffmpeg/ffmpeg-core.worker.js`;
const wasmPath = `/ffmpeg/ffmpeg-core.wasm`;

export async function setupFFmpegTranscode(options: {
    inputGif: HTMLImageElement;
    video: HTMLVideoElement;
}) {
    // 初始化 ffmpeg.wasm
    const ffmpeg = createFFmpeg({
        log: true,
        corePath,
        workerPath,
        wasmPath,
    });
    await ffmpeg.load();

    const inputName = `input.gif`;
    const outputName = `output.webm`;
    const gifBuffer = await fetchArrayBuffer(options.inputGif.src);

    // 写入 GIF 图片 buffer 到虚拟文件系统中
    ffmpeg.FS('writeFile', inputName, new Uint8Array(gifBuffer));

    await ffmpeg.run(
        '-i',
        inputName,
        '-vf',
        // gif 图片的分辨率不满足偶数像素，转码会引起报错，这里做个修正
        'pad=ceil(iw/2)*2:ceil(ih/2)*2',
        '-movflags',
        'faststart',
        '-pix_fmt',
        'yuva420p',
        outputName
    );

    // 从虚拟文件系统中读取转码视频
    const webmUint8Array = ffmpeg.FS('readFile', outputName);
    const blob = new Blob([webmUint8Array], { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    options.video.src = url;

    // 释放资源
    ffmpeg.FS('unlink', inputName);
}
```
createFFmpeg 建议手动指定 corePath、workerPath、wasmPath 路径，未配置依赖模块路径在浏览器环境会默认从 unpkg.com 下载，core、worker、wasm 模块可以在 @ffmpeg/core/dist 中找到，直接将其放在应用静态资源文件目录下即可，例如放在 vite 的 public 目录下。<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681353695829-3f819a0b-835a-4df0-9596-a5c2e7e8f414.png#averageHue=%230a253f&clientId=u37b9f9e8-e34b-4&from=paste&height=278&id=ud4f641e0&name=image.png&originHeight=278&originWidth=685&originalType=binary&ratio=1&rotation=0&showTitle=false&size=31668&status=done&style=none&taskId=ud98ce851-705b-47bf-a9c3-d4183fd582a&title=&width=685)<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681353785132-015e53b6-7953-44b9-9545-dacbfb7f2b91.png#averageHue=%23142e48&clientId=u37b9f9e8-e34b-4&from=paste&height=199&id=u2f345d46&name=image.png&originHeight=199&originWidth=703&originalType=binary&ratio=1&rotation=0&showTitle=false&size=23655&status=done&style=none&taskId=ue586c90a-cddd-4c9e-9d2e-1301af53f68&title=&width=703)<br />使用 wasm 遇到 SharedArrayBuffer 的问题需要配置资源请求头。
> SharedArrayBuffer is only available to pages that are [cross-origin isolated](https://developer.chrome.com/blog/enabling-shared-array-buffer/#cross-origin-isolation). So you need to host [your own server](https://github.com/ffmpegwasm/ffmpegwasm.github.io/blob/main/server/server.js) with Cross-Origin-Embedder-Policy: require-corp and Cross-Origin-Opener-Policy: same-origin headers to use ffmpeg.wasm.

```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'configure-response-headers',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader(
            'Cross-Origin-Embedder-Policy',
            'require-corp'
          );
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          next();
        });
      },
    },
  ],
});
```
```json
{
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {
                    "key": "Cross-Origin-Embedder-Policy",
                    "value": "require-corp"
                },
                { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
            ]
        }
    ]
}
```
ffmpeg.wasm 好用也能解决转码的问题，但也有些无法规避的问题：<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681360406517-da0a7cf5-834e-48b6-b7b9-7170cd08d9ee.png#averageHue=%230c0c0c&clientId=u37b9f9e8-e34b-4&from=paste&height=95&id=ud638813d&name=image.png&originHeight=95&originWidth=738&originalType=binary&ratio=1&rotation=0&showTitle=false&size=17384&status=done&style=none&taskId=u69733d7d-cd46-4c44-942f-db24963675c&title=&width=738)<br />依赖 wasm 文件过大，**资源加载比较耗费时间**，当然也可以针对性阉割掉不需要的 ffmpeg 模块自行构建 wasm。主要的问题还是**性能的问题**，转码同一 GIF 图片，wasm 版本的 FFmpeg 性能差了很多。
```json
5.47s user 0.13s system 305% cpu 1.833 total
```
![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681365546331-4d33acae-fb36-4e18-8b44-cf7f04c8f2a6.png#averageHue=%238d835a&clientId=u37b9f9e8-e34b-4&from=paste&height=350&id=u3aad326d&name=image.png&originHeight=350&originWidth=559&originalType=binary&ratio=1&rotation=0&showTitle=false&size=320717&status=done&style=none&taskId=u46b67b20-56c5-42fc-86c9-66dcf6bbe66&title=&width=559)<br />上述 4s 的 GIF 使用本地转码与 wasm 转码分别用了 **1.833s** 与 **10.568s **差距还是很明显的，越长的 GIF 转码差别越明显。<br />测试 30s 640x360 GIF 图片转码成 WebM 视频对比：
```bash
67.04s user 0.70s system 362% cpu 18.699 total
```
![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681369317709-f98a8863-6791-4c74-8c19-19fcc22c0cc7.png#averageHue=%23948865&clientId=u37b9f9e8-e34b-4&from=paste&height=357&id=ud09112e1&name=image.png&originHeight=357&originWidth=567&originalType=binary&ratio=1&rotation=0&showTitle=false&size=400516&status=done&style=none&taskId=ubd695d46-d035-4151-b0f7-c8772807661&title=&width=567)<br />18.699 与 131.988 速度差了 7 倍，FFmpeg 转成 wasm 版本后，由于浏览器的限制无法享受各种原生多线程与 GPU 优化所以效率会差很多。上述测试已经在 ffmpeg.wasm 中开启[多线程支持](https://github.com/ffmpegwasm/ffmpeg.wasm#multi-threading)远无法达到本地版本的速度。

那是不是可以考虑摆脱 FFmpeg 依赖，使用浏览器原生能力实现 GIF 到视频转换？
<a name="eg4Mw"></a>
## 解码 GIF 生成视频
由于 GIF 就是由一系列图片帧构成的，所以 GIF 生成视频思路很清晰

- 解析出 GIF 图片帧
- 合并多帧图片生成视频

找找有没有对应工具库实现即可：<br />在浏览器环境可用的 GIF 解析库并不多，都和 GIF 本身一样带点腐朽的气息，稍微新一点的库就是 [gifuct-js](https://github.com/matt-way/gifuct-js)，使用 gifuct 解析 GIF 可以获取到图片帧数据：
```javascript
  import { parseGIF, decompressFrames } from 'gifuct-js'

  const promisedGif = fetch(gifURL)
       .then(resp => resp.arrayBuffer())
       .then(buff => {
           const gif = parseGIF(buff)
           const frames = decompressFrames(gif, true)
           return { gif, frames };
       });
```
由于我们目标视频格式为 WebM 找找对应浏览器环境生成 WebM 的库即可，这里使用的是 [webm-writer-js](https://github.com/thenickdude/webm-writer-js)， gifuct 与 webm-writer 生成视频：
```typescript
import { parseGIF, decompressFrames } from 'gifuct-js';
import WebMWriter from 'webm-writer';
import { fetchArrayBuffer } from './utils';

export async function setupParseGifToWebm(options: {
  inputGif: HTMLImageElement;
  video: HTMLVideoElement;
}) {
  // 加载GIF
  const gifBuffer = await fetchArrayBuffer(options.inputGif.src);
  const gif = parseGIF(gifBuffer);
  const frames = decompressFrames(gif, true);

  const videoWriter = new WebMWriter({
    quality: 1, // WebM image quality from 0.0 (worst) to 0.99999 (best), 1.00 (VP8L lossless) is not supported
    fileWriter: null, // FileWriter in order to stream to a file instead of buffering to memory (optional)
    fd: null, // Node.js file handle to write to instead of buffering to memory (optional)

    frameDuration: frames[0].delay, // Duration of frames in milliseconds
    frameRate: 1000 / frames[0].delay, // Number of frames per second

    transparent: true, // True if an alpha channel should be included in the video
    alphaQuality: 1, // Allows you to set the quality level of the alpha channel separately.
  });

  const canvas = document.createElement('canvas');
  canvas.width = frames[0].dims.width;
  canvas.height = frames[0].dims.height;

  for (let frame of frames) {
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const data = new ImageData(
      frame.patch,
      frame.dims.width,
      frame.dims.height
    );
    ctx.putImageData(data, frame.dims.left, frame.dims.top);
    // 写入图片帧
    videoWriter.addFrame(canvas);
  }

  const webMBlob = await videoWriter.complete();
  const WebMBlobURL = URL.createObjectURL(webMBlob);
  options.video.src = WebMBlobURL;
}
```
![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681375556807-92792713-0e25-4358-bb26-6b5e19250b18.png#averageHue=%2390875c&clientId=u37b9f9e8-e34b-4&from=paste&height=370&id=u07674c9b&name=image.png&originHeight=370&originWidth=568&originalType=binary&ratio=1&rotation=0&showTitle=false&size=340010&status=done&style=none&taskId=uebaf5892-3ecd-4f21-8e0d-84c25bf5d1b&title=&width=568)<br />**同样是处理 4s 的 GIF 可直接将处理速度将至 1.01s 比 FFmpeg 还快！**

使用浏览器原生环境进行 GIF 转码不失为一种更好的解决方案，但受限于工具库实现，还是有些 GIF 转换的问题；例如一些转码帧图片解析的问题，使用 gifuct-js 进行图片帧解析时发现一些 GIF 会发生**像素错乱**的情况，看实现上是与图片帧的 Alpha 通道解析有关，暂时无解。<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681376315074-aaca4b0a-37cd-4112-a80e-067b5c722254.png#averageHue=%23c9c3b5&clientId=u37b9f9e8-e34b-4&from=paste&height=737&id=uf0e64352&name=image.png&originHeight=737&originWidth=579&originalType=binary&ratio=1&rotation=0&showTitle=false&size=599661&status=done&style=none&taskId=u303cd452-abb3-4f12-ae35-c439f59eaad&title=&width=579)<br />那是不是可以摆脱 gif 解析库依赖，使用浏览器的原生 API 实现图片与视频编解码呢？答案是肯定的，[WebCodecs API ](https://developer.mozilla.org/zh-CN/docs/Web/API/WebCodecs_API)可解。
<a name="yBnMI"></a>
## WebCodecs 处理图片视频转码
[https://developer.mozilla.org/zh-CN/docs/Web/API/WebCodecs_API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebCodecs_API)<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681377469634-69eedb41-9f08-4ea7-a3ba-cb036acbcf2e.png#averageHue=%23fafafa&clientId=u37b9f9e8-e34b-4&from=paste&height=571&id=ue81860b0&name=image.png&originHeight=571&originWidth=350&originalType=binary&ratio=1&rotation=0&showTitle=false&size=30779&status=done&style=none&taskId=u59ff5dd6-bc8b-4ee9-9f94-70d6c733ace&title=&width=350)

> **WebCodecs API** 为 web 开发者提供了对视频流的单个帧和音频数据块的底层访问能力。这对于那些需要完全控制媒体处理方式的 web 应用程序非常有用。例如，视频或音频编辑器，以及视频会议。
> <br />许多 Web API 在内部都使用了媒体编码器。例如，[Web Audio API](https://developer.mozilla.org/zh-CN/docs/Web/API/Web_Audio_API)，以及 [WebRTC API](https://developer.mozilla.org/zh-CN/docs/Web/API/WebRTC_API)。然而，这些 API 不允许开发者处理视频流的单个帧和未合成的编码音频块或视频块。
> 
> Web 开发者通常使用 WebAssembly 来绕过这一限制，并在浏览器中使用媒体编解码器。然而，这需要额外的带宽来下载浏览器中已经存在的编解码器，降低了性能和能效，并增加了额外的开发成本。
> WebCodecs API 提供了对浏览器中已存在的编解码器的访问能力。它可以访问原始视频帧、音频数据块、图像解码器、音频和视频的编码器及解码器。


Webcodecs 提供一系列针对各种媒体资源的编解码 API，我们的需求是实现 GIF **图片的解析**与**视频生成**，对应**图片解码**与**视频编码**，需要用到 [ImageDecoder](https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder) 与 [VideoEncoder](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder)。
<a name="O67Ma"></a>
### ImageDecoder 图片解码
[https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder)<br />先看看如何使用 ImageDecoder 对 GIF 图片进行解码：
```typescript
const fetchImageByteStream = async (gifURL: string) => {
    const response = await fetch(gifURL);
    return response.body!;
};

export const testImageDecoder = async (gifURL: string) => {
    const imageByteStream = await fetchImageByteStream(gifURL);
    // 创建 imageDecoder
    const imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    });

    // 等待 imageDecoder 初始化完成
    await imageDecoder.tracks.ready;
    await imageDecoder.completed;

    // 解码图片第一帧图片信息
    const headFrame = await imageDecoder.decode({ frameIndex: 0 });
  
    // 将解码帧图片绘制到 canvas 上
    const { codedWidth, codedHeight } = headFrame.image;
    const canvas = document.createElement('canvas');
    canvas.width = codedWidth;
    canvas.height = codedHeight;
  
    // image 是一个 VideoFrame 对象，可直接绘制在 Canvas 上
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(headFrame.image, 0, 0);

    const dataURL = canvas.toDataURL();
    console.log({ imageDecoder, headFrame, dataURL });
};
```
使用十分简单，传入 GIF 图片的 [ReadableStream](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) 构造解码器，使用 [imageDecoder.decode](https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder/decode) 指定解码的图片帧索引即可。<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681379598837-30e58ce5-805e-4fd0-b8f7-5d49e94f58e1.png#averageHue=%23fefefe&clientId=u37b9f9e8-e34b-4&from=paste&height=893&id=u120ae948&name=image.png&originHeight=893&originWidth=1010&originalType=binary&ratio=1&rotation=0&showTitle=false&size=233962&status=done&style=none&taskId=u59271df0-7166-4dc1-9899-12dd05509a8&title=&width=1010)

图片只有一个图片轨道**，**所以 tracks 的轨道只有一个，如果是 [VideoDecoder](https://developer.mozilla.org/en-US/docs/Web/API/VideoDecoder) 则可能会有多个视频或音频轨道。**imageDecoder.tracks.selectedTrack.frameCount **表示当前图片总帧数量，静态的图如 JPEG、PNG frameCount** **为一，动图如 GIF、WebP、APNG frameCount 则可能大于一。通过指定 frameIndex 则可以指定需要解码的图片帧。<br />decode 返回的 image 是一个 [VideoFrame](https://developer.mozilla.org/en-US/docs/Web/API/VideoFrame) 对象，其除了可以直接绘制在 Canvas 上还附带了一些图片帧信息：

- codedWidth/codedHeight 图片帧的宽高
- timestamp 当前帧的播放时间戳
- duration 当前帧的持续时间

这些信息在后面生成视频需要用到，**需要注意 timestamp 与 duration 的单位都是纳秒，**单位换算时需要注意！
<a name="KPHST"></a>
### VideoEncoder 视频编码
[https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder)<br />解析出图片帧数据后，剩下的就是将图片帧编码转换成视频数据，VideoEncoder 提供逐帧编码视频的能力，简单的图片帧示例如下：
```typescript
const testVideoEncoder = async () => {
    // 自定视频封装器
    const someMuxer = {
        addVideoChunk(
            chunk: EncodedVideoChunk,
            meta: EncodedVideoChunkMetadata
        ) {
            // 使用视频包装器混合视频通道
        },
        output() {
            return new Blob();
        },
    };

    // 图片帧数据
    const frames: VideoFrame[] = [];
    let frameIndex = 0;
    const webmVideoEncoder = new VideoEncoder({
        output: async (chunk, meta) => {
            // 所有视频帧编码完成 
            if (frameIndex === frames.length) {
                await webmVideoEncoder.flush();
                const videoBlob = someMuxer.output();
                webmVideoEncoder.close();
                console.log(videoBlob);
                return;
            }

            someMuxer.addVideoChunk(chunk, meta);
            frameIndex += 1;
        },
        error: (e) => console.error(e),
    });

    // 指定编辑最终视频的编码格式
    webmVideoEncoder.configure({
        codec: 'vp09.00.10.08',
        width: 640,
        height: 360,
        bitrate: 1e6,
    });

    frames.forEach((videoFrame) => {
        webmVideoEncoder.encode(videoFrame, { keyFrame: true });
    });
};
```
VideoEncoder 使用上也比较简单，同画一只马一样：

- 创建视频编码器，output 回调用于输出视频 chunk 包装
- 使用 configure 指定视频编码格式、比特率、帧率等，完整配置可参考 [configure#parameters](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder/configure)
- 逐帧编码图片的 VideoFrame
- 完成视频编码，关闭编码器

但有很重要的一点，就是需要理解一个概念：**output 输出的只是编码后的视频轨道 chunk，简单的将视频 chunk 拼在一起是无法生成视频文件的。视频文件是一个包装文件格式，需要包装器（muxer）将视频轨道、音频轨道及字幕打包成一个视频才行。而 WebEncoder 只是视频轨道的编码器，WebCodecs API 并未包含包装器的实现，这块需要用户自行实现。**举个例子，你无法通过下面的 chunk 拼接生成视频文件：
```typescript
const testVideoEncoder = async () => {
    const chunks: ArrayBuffer[] = [];
    let frameIndex = 0;
    const webmVideoEncoder = new VideoEncoder({
        output: async (chunk, meta) => {
            if (frameIndex === frames.length) {
                await webmVideoEncoder.flush();
                webmVideoEncoder.close();
                // 这样是错误的，不能简单做 chunk 拼接，需要视频包装器的介入才能生成真正视频文件
                const videoBlob = new Blob(chunks, { type: 'video/webm; codecs=vp09.00.10.08' });
                console.log(videoBlob);
                return;
            }

            const buffer = new ArrayBuffer(chunk.byteLength);
            chunk.copyTo(buffer);
            chunks.push(buffer);
            frameIndex += 1;
        },
        error: (e) => console.error(e),
    });

    // 指定编辑最终视频的编码格式
    webmVideoEncoder.configure({
        codec: 'vp09.00.10.08',
        width: 640,
        height: 360,
        bitrate: 1e6,
    });

    // 图片帧数据
    const frames: VideoFrame[] = [];
    frames.forEach((videoFrame) => {
        webmVideoEncoder.encode(videoFrame, { keyFrame: true });
    });
};
```
<a name="NH6Uq"></a>
### 视频编码与包装格式
[https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content](https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content)<br />![](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681401649648-4b1dafa9-9454-4bfb-a5e5-944f5f5a5c5a.png#averageHue=%23eaf0ed&clientId=u6959efc4-0bad-4&from=paste&id=u90c435d1&originHeight=939&originWidth=1175&originalType=url&ratio=1.5&rotation=0&showTitle=false&status=done&style=none&taskId=uf85dedf8-f5b6-454b-8895-36e7bad8778&title=)<br />简单讲一下视频编码与视频包装格式的关系：<br />一个视频通常是由视频、音频、还有字幕构成，一个视频可能会包含：

- 多个视频轨道：通常，一个视频文件只包含一个视频轨道，这个轨道包含了整个视频的图像数据。但是，有些视频文件可能会包含多个视频轨道，每个轨道对应着不同的视频内容或者角度。
- 多个音频轨道：比如分左右声道，环境声
- 多个字幕信息：多语言字幕

而一个视频文件就像一个 ZIP 文件将视频、音频还有字幕等数据按照格式需要要求规范打包成一个了文件，我们常见的所谓视频格式 MP4、WebM、MKV、AVI、FLV 即为视频包装的格式。<br />不同的视频包装格式，规定了其不同的音视频与字幕编码方式，同种视频包装格式也可能支持多种音视频编码，可以简单看下 MP4 与 WebM 格式所支持的音视频及字幕编码.

MP4 支持多种视频编码、音频编码和字幕编码：<br />视频编码：

- H.264/AVC
- H.265/HEVC
- MPEG-4 Part 2
- MPEG-2
- VP9
- AV1

音频编码：

- AAC
- MP3
- AC3
- DTS
- Dolby Atmos

字幕编码：

- Timed Text (TTXT)
- SubRip (SRT)
- Advanced Substation Alpha (ASS)
- Scenarist Closed Caption (SCC)
- QuickTime Text (QTXT)

WebM 支持以下视频编码、音频编码和字幕编码：<br />视频编码：

- VP8
- VP9

音频编码：

- Vorbis
- Opus

字幕编码：

- WebVTT

在使用 WebCodecs 时，其并未包含视频包装器的实现，所以需要我们实现对应视频格式的包装器。
<a name="zxUU6"></a>
### WebCodecs GIF To WebM
弄清楚了 ImageDecoder 与 VideoEncoder，只需要找一个合适的视频容器包装器将其组合起来即可。

- MP4 视频包装器可使用：[mp4box.js](https://github.com/gpac/mp4box.js/)
- WebM 视频包装器可使用：[webm-muxer](https://github.com/Vanilagy/webm-muxer)

这需要将 GIF 转 WebM，所以选择 webm-muxer 来实现：
```typescript
import WebMMuxer from 'webm-muxer';

const fetchImageByteStream = async (gifURL: string) => {
    const response = await fetch(gifURL);
    return response.body!;
};

/**
 * 创建图片解码器
 * @param imageByteStream
 * @returns
 */
const createImageDecoder = async (imageByteStream: ReadableStream<Uint8Array>) => {
    const imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    });

    await imageDecoder.tracks.ready;
    await imageDecoder.completed;
    return imageDecoder;
};

/**
 * GIF 转码 WebM
 * @param imageDecoder
 * @param size
 * @returns
 */
const decodeGifMuxWebM = async (imageDecoder: ImageDecoder) => {
    const { image: headFrame } = await imageDecoder.decode({ frameIndex: 0 });
    // 注意单位时纳秒需要先转成微秒
    const frameDuration = headFrame.duration! / 1000;
    const frameCount = imageDecoder.tracks.selectedTrack!.frameCount;
    return new Promise<string>((resolve) => {
        // 创建 WebM 包装器
        const webmMuxer = new WebMMuxer({
            target: 'buffer',
            video: {
                codec: 'V_VP9',
                width: headFrame.codedWidth,
                height: headFrame.codedHeight,
                frameRate: 1000 / frameDuration,
                alpha: true,
            },
        });

        let frameIndex = 0;
        const webmVideoEncoder = new VideoEncoder({
            output: async (chunk, meta) => {
                webmMuxer.addVideoChunk(chunk, meta);
                // 转码结束，生成视频
                if (frameIndex === frameCount) {
                    await webmVideoEncoder.flush();
                    const webmBuffer = webmMuxer.finalize()!;
                    const webmBlobURL = URL.createObjectURL(new Blob([webmBuffer]));
                    resolve(webmBlobURL);
                }
            },
            error: (e) => console.error(e),
        });

        // 设置视频转码格式
        webmVideoEncoder.configure({
            codec: 'vp09.00.10.08',
            width: headFrame.codedWidth,
            height: headFrame.codedHeight,
            bitrate: 1e6,
        });

        // 逐帧编码
        const encodeVideoFrame = async () => {
            if (frameIndex >= frameCount) return;
            const result = await imageDecoder.decode({ frameIndex });
            webmVideoEncoder.encode(result.image, { keyFrame: true });
            result.image.close();
            frameIndex += 1;
            await encodeVideoFrame();
        };

        encodeVideoFrame();
    });
};

export async function setupImageDecodeMuxWebm(options: {
    inputGif: HTMLImageElement;
    video: HTMLVideoElement;
}) {
    const image = options.inputGif;
    const imageByteStream = await fetchImageByteStream(image.src);
    const imageDecoder = await createImageDecoder(imageByteStream);
    const webmBlobURL = await decodeGifMuxWebM(imageDecoder, {
        width: image.naturalWidth,
        height: image.naturalHeight,
    });

    options.video.src = webmBlobURL;
}
```
![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681403116582-f259f6db-9493-446c-81d1-f0e19afffde5.png#averageHue=%23dad6cf&clientId=u6959efc4-0bad-4&from=paste&height=894&id=u7bd95c90&name=image.png&originHeight=1341&originWidth=3110&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=3697698&status=done&style=none&taskId=ua5e0965e-6db0-450d-88bc-b934e4e4a40&title=&width=2073.3333333333335)<br />基于 ImageDecoder 实现的图片解析可以很好规避掉 gifuct 的图片解析问题。<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681403702759-dfef994b-8776-4349-86a3-c8a269b2d81b.png#averageHue=%239f9969&clientId=u6959efc4-0bad-4&from=paste&height=886&id=u82c358e0&name=image.png&originHeight=1329&originWidth=3110&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=4791920&status=done&style=none&taskId=u0ec5818f-1264-4cf9-a83f-eff452e44d2&title=&width=2073.3333333333335)<br />可以比较一下最终的转码性能，4s 视频:

- ffmpeg.wasm 转码  12.867s
- gifuct 解析 & webm-writer 生成 0.925s
- ImageDecoder + VideoEncoder 生成 0.4s

![微信截图_20230414010356.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/1039081/1681405462089-35d7086b-a509-4746-a069-7ca57c85ed01.jpeg#averageHue=%239d9876&clientId=u6959efc4-0bad-4&from=paste&height=894&id=u77845771&name=%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20230414010356.jpg&originHeight=1341&originWidth=3110&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=695003&status=done&style=none&taskId=u316ca748-aee6-40c4-8071-34742a5a5f0&title=&width=2073.3333333333335)<br />30s 视频:

- ffmpeg.wasm 转码  147.769s
- gifuct 解析 & webm-writer 生成 18.118s
- ImageDecoder + VideoEncoder 生成  4.138s 

**WebCodecs 对长 GIF 转码效率有着质的提升**！示例在这：[https://gif-to-wasm-video.vercel.app](https://gif-to-wasm-video.vercel.app/)
<a name="aP2VG"></a>
### 其他问题
![微信截图_20230414010910.jpg](https://cdn.nlark.com/yuque/0/2023/jpeg/1039081/1681405769940-7175f2e8-21aa-4f2b-826f-e6a32dbe797a.jpeg#averageHue=%23cbccc8&clientId=u6959efc4-0bad-4&from=paste&height=1053&id=u2309a8c3&name=%E5%BE%AE%E4%BF%A1%E6%88%AA%E5%9B%BE_20230414010910.jpg&originHeight=1580&originWidth=3755&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=212351&status=done&style=none&taskId=u95cc7d13-327b-43ff-8a8a-3161886ec13&title=&width=2503.3333333333335)<br />受限与 WebM 视频库的实现  [webm-writer-js](https://github.com/thenickdude/webm-writer-js) 与 [webm-muxer](https://github.com/Vanilagy/webm-muxer) 其生成视频都无法还原 GIF 的 Alpha 通道信息，这一点不如 ffmpeg.wasm，或许可以试试换成 [mp4box.js](https://github.com/gpac/mp4box.js/) 包装成 MP4。

- [https://github.com/thenickdude/webm-writer-js#transparent-webm-support](https://github.com/thenickdude/webm-writer-js#transparent-webm-support)
- [https://github.com/Vanilagy/webm-muxer/issues/9](https://github.com/Vanilagy/webm-muxer/issues/9)

注意，WebCodes API 算是比较新的 API 使用需要考虑浏览器的兼容性。<br />[https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder#browser_compatibility](https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder#browser_compatibility)<br />[https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder#browser_compatibility](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder#browser_compatibility)
<a name="K1fep"></a>
## 使用 Canvas 录制实现 GIF 转码
还有一种方式可以 GIF 转视频的功能，原理很简单，按照 GIF 帧率逐帧在 Canvas 上绘制 GIF 帧图片，将这个绘制过程录制成视频即可。

- 针对 Canvas 可以使用 [HTMLCanvasElement.captureStream()](https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLCanvasElement/captureStream) 创建实施的视频媒体流。
- 使用 [MediaRecorder](https://developer.mozilla.org/zh-CN/docs/Web/API/MediaRecorder) 即可完成对 Canvas 视频媒体流的录制生成视频

这个方案有个缺点就是生成视频速度与 GIF 时长相关，因为需要按帧率在 Cavans 上依次绘制，越长的 GIF 所花费的时间自然越长，显现如下：
```typescript
import fixWebmDuration from 'fix-webm-duration';

const fetchImageByteStream = async (gifURL: string) => {
    const response = await fetch(gifURL);
    return response.body!;
};

const createImageDecoder = async (imageByteStream: ReadableStream<Uint8Array>) => {
    const imageDecoder = new ImageDecoder({
        data: imageByteStream,
        type: 'image/gif',
    });
    await imageDecoder.tracks.ready;
    await imageDecoder.completed;
    return imageDecoder;
};

const decodeGifRecordWebM = async (imageDecoder: ImageDecoder) => {
    const { image: headFrame } = await imageDecoder.decode({ frameIndex: 0 });
    const frameCount = imageDecoder.tracks.selectedTrack!.frameCount;
    const frameDuration = headFrame.duration! / 1000;

    // 创建绘制画布
    const canvas = document.createElement('canvas');
    canvas.width = headFrame.codedWidth;
    canvas.height = headFrame.codedHeight;
    const ctx = canvas.getContext('2d')!;

    return new Promise<string>((resolve) => {
        // 录制器
        let mediaRecorder: MediaRecorder = Object.create(null);

        const startRecord = () => {
            // 指定视频格式
            const defaultMimeType = 'video/webm;codecs=vp9';
            // 视频时长
            let recordMediaDuration = 0;
            // 创建 canvas 的媒体流
            const canvasStream = canvas.captureStream(1000 / frameDuration);
            // 创建 canvas 录制器
            mediaRecorder = new MediaRecorder(canvasStream, {
                mimeType: defaultMimeType,
                videoBitsPerSecond: 1e6,
            });

            // mediaRecorder.requestData() 会触发 ondataavailable
            mediaRecorder.ondataavailable = async (e) => {
                if (!e.data || !e.data.size) return;

                // 获取录制数据
                const videoBlob = new Blob([e.data], { type: defaultMimeType });
                // 修复 webm 录制丢失 duration
                const webmBlob = await fixWebmDuration(videoBlob, recordMediaDuration, {
                    logger: false,
                });
                resolve(URL.createObjectURL(webmBlob));
            };

            // 浏览器录制 webm 视频会有丢失视频时长信息的情况，需要通过 fixWebmDuration 修复
            const startTime = Date.now();
            mediaRecorder.onstop = () => {
                recordMediaDuration = Date.now() - startTime;
            };

            // 开始录制
            mediaRecorder.start();
        };

        const stopRecord = async () => {
            mediaRecorder.requestData();
            mediaRecorder.stop();
        };

        let frameIndex = 0;

        const drawVideoFrame = async () => {
            // 绘制完成，停止录制
            if (frameIndex >= frameCount) {
                stopRecord();
                return;
            }

            const result = await imageDecoder.decode({ frameIndex });
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(result.image, 0, 0);
            result.image.close();

            // 设置 canvas 绘制间隔
            const frameDuration = result.image.duration! / 1000;
            setTimeout(() => {
                frameIndex += 1;
                drawVideoFrame();
            }, frameDuration);
        };

        // 开始绘制录制
        drawVideoFrame();
        startRecord();
    });
};

export async function setupImageDecodeRecordWebm(options: {
    inputGif: HTMLImageElement;
    video: HTMLVideoElement;
}) {
    const image = options.inputGif;
    const imageByteStream = await fetchImageByteStream(image.src);
    const imageDecoder = await createImageDecoder(imageByteStream);
    const webmBlobURL = await decodeGifRecordWebM(imageDecoder);

    options.video.src = webmBlobURL;
}
```
转码 2s 视频与 30s 视频对比:<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681410706936-11c73c9f-bbe7-42b7-918b-908d019e2f2f.png#averageHue=%23cec6b6&clientId=u6959efc4-0bad-4&from=paste&height=379&id=u71c96abc&name=image.png&originHeight=569&originWidth=856&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=443689&status=done&style=none&taskId=uda6e9d6d-6f24-4702-8ec6-58b8b67fd2a&title=&width=570.6666666666666)<br />![image.png](https://cdn.nlark.com/yuque/0/2023/png/1039081/1681410775012-3ada5fff-1871-4747-b6d1-b8ed822345f3.png#averageHue=%234c4d40&clientId=u6959efc4-0bad-4&from=paste&height=386&id=u8d645de4&name=image.png&originHeight=579&originWidth=866&originalType=binary&ratio=1.5&rotation=0&showTitle=false&size=702854&status=done&style=none&taskId=u34c47a66-16e7-46d3-802c-3b77a372471&title=&width=577.3333333333334)<br />需要注意：

-  每次 mediaRecorder.requestData 都会触发 dataavailable 事件
- 浏览器录制的 webM 视频普遍有丢失 duration 问题，需要用 [fix-webm-duration](https://github.com/yusitnikov/fix-webm-duration) 修正
- 生成视频并不精确，因为播放速率是由 setTimeout 控制，其并不精确，转码时间所需时间会比 GIF 长度多一些
<a name="sVLN4"></a>
## 其他
总的来说基于浏览器环境实现的 GIF 转码效率都是优于 ffmpeg.wasm 的，但还是有些问题需要考虑：

- API 的兼容性
- 生成视频的 Alpha 通道问题（这可以尝试换视频编码与视频包装格式解决）
<a name="uW1Vw"></a>
### 示例

- [GitHub - kinglisky/gif.to.video: Gif to WebM test](https://github.com/kinglisky/gif.to.video)
- [https://gif-to-wasm-video.vercel.app/](https://gif-to-wasm-video.vercel.app/)
<a name="a0cTP"></a>
### 参考资料

- [视频和音频内容 - 学习 Web 开发 | MDN](https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Multimedia_and_embedding/Video_and_audio_content)
- [WebCodecs API - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebCodecs_API)
- [ImageDecoder - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/ImageDecoder)
- [VideoEncoder - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/VideoEncoder)
- [https://github.com/ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)
- [GitHub - thenickdude/webm-writer-js: JavaScript-based WebM video encoder for Google Chrome](https://github.com/thenickdude/webm-writer-js)
- [GitHub - Vanilagy/webm-muxer: WebM multiplexer in pure TypeScript with support for WebCodecs API, video & audio.](https://github.com/Vanilagy/webm-muxer)
- [WebCodecs > VideoEncoder: Create video from encoded frames](https://stackoverflow.com/questions/70313774/webcodecs-videoencoder-create-video-from-encoded-frames)

