import { readFile } from 'fs';
import { decode } from 'wav-decoder';

function processAudio(audioPath, callback) {
  readFile(audioPath, (err, audioBuffer) => {
    if (err) {
      callback(err);
      return;
    }

    decode(audioBuffer)
      .then(audioData => {
        const audioChannels = audioData.channelData;
        const audioLength = audioChannels[0].length;
        const sampleRate = audioData.sampleRate;

        const lowFreqRange = [20, 250];
        const midFreqRange = [250, 4000];
        const highFreqRange = [4000, sampleRate / 2];

        let lowFreqSum = 0;
        let midFreqSum = 0;
        let highFreqSum = 0;

        for (let i = 0; i < audioLength; i++) {
          const freq = (i / audioLength) * (sampleRate / 2);

          if (freq >= lowFreqRange[0] && freq <= lowFreqRange[1]) {
            lowFreqSum += Math.abs(audioChannels[0][i]);
          } else if (freq > midFreqRange[0] && freq <= midFreqRange[1]) {
            midFreqSum += Math.abs(audioChannels[0][i]);
          } else if (freq > highFreqRange[0] && freq <= highFreqRange[1]) {
            highFreqSum += Math.abs(audioChannels[0][i]);
          }
        }

        const lowFreqAvg = lowFreqSum / audioLength;
        const midFreqAvg = midFreqSum / audioLength;
        const highFreqAvg = highFreqSum / audioLength;

        callback(null, {
          lowFreqAvg,
          midFreqAvg,
          highFreqAvg
        });
      })
      .catch(err => {
        callback(err);
      });
  });
}

module.exports = {
  processAudio
};