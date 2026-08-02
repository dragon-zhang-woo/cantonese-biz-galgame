class CantoneseBizPcmProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputRate = sampleRate;
    this.targetRate = 16000;
    this.position = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel?.length) return true;
    let energy = 0;
    for (const sample of channel) energy += sample * sample;
    const level = Math.min(1, Math.sqrt(energy / channel.length) * 3);
    const ratio = this.inputRate / this.targetRate;
    const output = [];
    while (this.position < channel.length) {
      const sample = Math.max(-1, Math.min(1, channel[Math.floor(this.position)]));
      output.push(sample < 0 ? sample * 0x8000 : sample * 0x7fff);
      this.position += ratio;
    }
    this.position -= channel.length;
    const pcm = new Int16Array(output);
    if (pcm.length) {
      this.port.postMessage({ pcm: pcm.buffer, level }, [pcm.buffer]);
    }
    return true;
  }
}

registerProcessor("cantonese-biz-pcm", CantoneseBizPcmProcessor);
