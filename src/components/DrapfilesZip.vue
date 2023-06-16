<template>
  <div>
    <div class="drop-area" @dragover="handleDragOver" @drop="handleDrop">
      <p>将文件拖放到此处</p>
    </div>
    <input type="file" multiple accept="video/mp4" @change="handleFileSelect" />
    <div>
      <button :disabled="loading" @click="handleConvertFiles">
        {{ loading ? '正在转换中，请稍等～' : '点击开始转换' }}
      </button>
    </div>
    <div>
      <h3>已选择的文件:</h3>
      <ul>
        <li v-for="file in selectedFiles" :key="file.name">{{ file.name }}</li>
      </ul>
    </div>
  </div>
</template>

<script>
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import JSZip from 'jszip';

export default {
  data() {
    return {
      ffmpeg: null,
      selectedFiles: [],
      loading: false,
    };
  },
  mounted() {
    // this.loadFFmpeg();
  },
  methods: {
    async loadFFmpeg() {
      this.ffmpeg = createFFmpeg({
        log: true,
      });

      if (!this.ffmpeg.isLoaded()) {
        await this.ffmpeg.load();
      }
    },
    async handleFileSelect(event) {
      this.selectedFiles = Array.from(event.target.files);
    },
    async handleDragOver(event) {
      event.preventDefault();
    },
    async handleDrop(event) {
      event.preventDefault();
      this.selectedFiles = Array.from(event.dataTransfer.files);
    },
    async convertFiles() {
      if (!this.selectedFiles.length) {
        console.error('No files selected');
        return;
      }

      this.loading = true; // 显示加载指示器

      const zip = new JSZip();

      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        const fileName = file.name;

        await this.ffmpeg.FS('writeFile', 'input.mp4', await fetchFile(file));

        await this.ffmpeg.run(
          '-i',
          'input.mp4',
          '-codec',
          'copy',
          '-map',
          '0',
          '-f',
          'hls',
          '-hls_time',
          '10',
          '-hls_list_size',
          '0',
          `output_${i}.m3u8`
        );

        const m3u8Data = await this.ffmpeg.FS('readFile', `output_${i}.m3u8`);

        // Add the M3U8 file to the ZIP
        zip.file(`${fileName.replace('.mp4', '')}.m3u8`, m3u8Data.buffer);

        // Remove the temporary files
        this.ffmpeg.FS('unlink', 'input.mp4');
        this.ffmpeg.FS('unlink', `output_${i}.m3u8`);
      }

      // Generate the ZIP file
      const content = await zip.generateAsync({ type: 'blob' });

      // Save the ZIP file
      this.saveFile(content, 'converted_files.zip');

      this.loading = false; // 关闭加载指示器
      this.selectedFiles = [];
    },
    saveFile(data, fileName) {
      const a = document.createElement('a');
      const url = URL.createObjectURL(data);
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    },
    async handleConvertFiles() {
      this.loading = true
      const formData = new FormData();
      for (let i = 0; i < this.selectedFiles.length; i++) {
        formData.append('files', this.selectedFiles[i]);
      }
      
      try {
        const response = await fetch('api/converter/m3u8', {
          method: 'POST',
          body: formData
        });
        if (response.ok) {
          console.log('文件上传成功');
        } else {
          console.error('文件上传失败');
        }
        this.loading = false
      } catch (e) {
        this.loading = false
        console.error('请求错误:', e);
      }
    }
  },
};
</script>

<style>
.drop-area {
  border: 2px dashed #aaa;
  padding: 20px;
  text-align: center;
}
</style>
