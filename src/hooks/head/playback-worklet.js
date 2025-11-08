class PlaybackWorklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = this.handleMessage.bind(this);

    this.bufferQueue = [];
    this.currentChunk = null;
    this.currentChunkOffset = 0;

    this.playbackStartedSignalled = false;
    this.noMoreData = false;
    this.playedAnyData = false;

    this.silenceFramesCount = 0;
    this.silenceThresholdBlocks = Math.ceil((sampleRate * 1.0) / 128);

    // ramp-in 30ms
    this.fadeSamples = Math.floor((30 / 1000) * sampleRate);
    this.prevChunkTail = new Float32Array(this.fadeSamples).fill(0);

    // 双高通滤波状态
    this.prevSample1 = 0;
    this.prevInput1 = 0;
    this.prevSample2 = 0;
    this.prevInput2 = 0;
    this.alpha = 0.985;
  }

  handleMessage(event) {
    const data = event.data;
    if (data?.type === "no-more-data") {
      this.noMoreData = true;
      return;
    }

    if (data instanceof ArrayBuffer) {
      this.bufferQueue.push(data);
      this.silenceFramesCount = 0;
    } else if (data instanceof Int16Array) {
      const bufferCopy = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
      this.bufferQueue.push(bufferCopy);
      this.silenceFramesCount = 0;
    } else {
      console.error("Unsupported data type received.");
    }
  }

  process(inputs, outputs) {
    const output = outputs[0]?.[0];
    if (!output) return false;

    const blockSize = output.length;
    let written = 0;

    // 初始无数据时输出全零
    if (!this.playbackStartedSignalled && this.bufferQueue.length === 0) {
      output.fill(0);
      return true;
    }

    while (written < blockSize) {
      if (!this.currentChunk || this.currentChunkOffset >= this.currentChunk.length) {
        if (this.bufferQueue.length > 0) {
          const nextBuffer = this.bufferQueue.shift();
          this.currentChunk = new Int16Array(nextBuffer);
          this.currentChunkOffset = 0;

          if (!this.playbackStartedSignalled) {
            this.port.postMessage({ type: "playback-started" });
            this.playbackStartedSignalled = true;
          }
        } else {
          for (let i = written; i < blockSize; i++) output[i] = 0;
          if (this.playbackStartedSignalled) this.silenceFramesCount++;
          break;
        }
      }

      const samplesToCopy = Math.min(blockSize - written, this.currentChunk.length - this.currentChunkOffset);

      for (let i = 0; i < samplesToCopy; i++) {
        const idx = written + i;
        let sample = this.currentChunk[this.currentChunkOffset + i] / 32768;

        // ramp-in 30ms
        const rampFactor = Math.min(this.currentChunkOffset / this.fadeSamples, 1.0);
        sample *= rampFactor;

        // chunk crossfade
        if (this.currentChunkOffset < this.fadeSamples) {
          const fadeFactor = this.currentChunkOffset / this.fadeSamples;
          const fadeOutPrev = this.prevChunkTail[this.currentChunkOffset] || 0;
          sample = sample * fadeFactor + fadeOutPrev * (1 - fadeFactor);
        }

        // 双高通滤波
        const hp1 = this.alpha * (this.prevSample1 + sample - this.prevInput1);
        this.prevSample1 = hp1;
        this.prevInput1 = sample;

        const hp2 = this.alpha * (this.prevSample2 + hp1 - this.prevInput2);
        this.prevSample2 = hp2;
        this.prevInput2 = hp1;

        output[idx] = hp2;
      }

      // 保存尾部用于下一个 chunk 交叉淡入
      const tailStart = Math.max(this.currentChunk.length - this.fadeSamples, 0);
      for (let j = 0; j < this.fadeSamples; j++) {
        const srcIdx = tailStart + j;
        this.prevChunkTail[j] = srcIdx < this.currentChunk.length ? this.currentChunk[srcIdx] / 32768 : 0;
      }

      this.currentChunkOffset += samplesToCopy;
      written += samplesToCopy;
      this.playedAnyData = true;
      this.silenceFramesCount = 0;
    }

    const queueEmpty = this.bufferQueue.length === 0;
    const currentDone = !this.currentChunk || this.currentChunkOffset >= this.currentChunk.length;

    if (this.noMoreData && queueEmpty && currentDone && this.playedAnyData) {
      this.port.postMessage({ type: "playback-ended" });
      this.resetStateAfterEnd();
      return false;
    }

    if (this.playbackStartedSignalled && this.silenceFramesCount > this.silenceThresholdBlocks) {
      this.port.postMessage({ type: "playback-ended" });
      this.resetStateAfterEnd();
      return false;
    }

    return true;
  }

  resetStateAfterEnd() {
    this.noMoreData = false;
    this.playbackStartedSignalled = false;
    this.playedAnyData = false;
    this.silenceFramesCount = 0;
    this.prevChunkTail.fill(0);
    this.prevSample1 = 0;
    this.prevInput1 = 0;
    this.prevSample2 = 0;
    this.prevInput2 = 0;
  }
}

registerProcessor("playback-worklet", PlaybackWorklet);
