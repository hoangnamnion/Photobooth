const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = 3000;

// Cấu hình CORS
app.use(cors());

// Cấu hình multer để lưu file tạm
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './temp';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// API endpoint để xử lý video
app.post('/photobooth/4-images/upload-video', upload.array('video', 4), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Không có video nào được gửi lên' });
    }

    // Tạo thư mục output nếu chưa có
    const outputDir = './output';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Tạo tên file output duy nhất
    const outputFileName = `merged_${Date.now()}.mp4`;
    const outputPath = path.join(outputDir, outputFileName);

    // Ghép các video lại với nhau
    const command = ffmpeg();
    
    // Thêm các video vào command
    req.files.forEach(file => {
      command.input(file.path);
    });

    // Cấu hình output
    command
      .on('end', () => {
        // Xóa các file tạm
        req.files.forEach(file => {
          fs.unlinkSync(file.path);
        });

        // Đọc file output và gửi về client
        const videoData = fs.readFileSync(outputPath);
        const base64Video = `data:video/mp4;base64,${videoData.toString('base64')}`;

        // Xóa file output
        fs.unlinkSync(outputPath);

        res.json({
          success: true,
          mergedVideo: base64Video
        });
      })
      .on('error', (err) => {
        console.error('Lỗi khi ghép video:', err);
        res.status(500).json({
          success: false,
          message: 'Lỗi khi ghép video'
        });
      })
      .mergeToFile(outputPath);

  } catch (error) {
    console.error('Lỗi:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi xử lý video'
    });
  }
});

// Khởi động server
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
}); 