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

const decodeGifMuxWebM = async (imageDecoder: ImageDecoder) => {
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
            // 绘制完成
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

export function setupImageDecodeRecordWebm(options: {
    inputGif: HTMLImageElement;
    button: HTMLButtonElement;
    video: HTMLVideoElement;
    time: HTMLSpanElement;
}) {
    const startTranscode = async () => {
        options.time.innerText = '开始转码...';
        const startTime = new Date();

        const image = options.inputGif;
        const imageByteStream = await fetchImageByteStream(image.src);
        const imageDecoder = await createImageDecoder(imageByteStream);
        const webmBlobURL = await decodeGifMuxWebM(imageDecoder);

        options.video.src = webmBlobURL;

        const endTime = new Date();
        const duration = (endTime.getTime() - startTime.getTime()) / 1000;
        options.time.innerText = `转码完成，用时 ${duration}s`;
    };

    options.button.addEventListener('click', startTranscode, false);
}
