# phím. — Hiểu rồi chơi

Website học piano bằng tiếng Việt và tiếng Anh. Imported from the complete cloud website (version 6).

## Nội dung

- 12 bài học với hình khuông nhạc, câu hỏi giải thích và bài tập bàn phím.
- Bàn phím tương tác, chọn 1–3 quãng tám, hợp âm, gam và metronome.
- Happy Birthday gồm 4 đoạn để nghe và luyện từng nốt.
- Từ điển âm nhạc, chọn ngôn ngữ và hai biểu mẫu riêng để báo lỗi / góp ý cải tiến.

## Chạy trên máy

Không cần cài thư viện hoặc build. Trong thư mục dự án, chạy:

```sh
python3 -m http.server 8000
```

Mở http://localhost:8000. Nhấn vào trang để trình duyệt cho phép phát âm thanh.

## GitHub Pages

Sau khi merge pull request, mở repository Settings → Pages. Chọn Deploy from a branch, branch `main`, thư mục `/ (root)` và Save. GitHub sẽ hiển thị địa chỉ website khi triển khai hoàn tất.

## Chỉnh sửa

- `index.html`: khung trang và điều hướng.
- `styles.css`: giao diện và hiển thị trên điện thoại.
- `app.js`: tương tác, âm thanh, hình khuông nhạc và tiến độ.
- `curriculum.js`: nội dung bài học song ngữ và bài nhạc.
- `locales.js`: bản dịch giao diện và từ điển.
- `assets/piano-logo.png`: logo piano do chủ website cung cấp, dùng trên thanh bên, đầu trang và biểu tượng tab.

Tiến độ, sao, ngôn ngữ và cài đặt bàn phím được lưu trong localStorage của trình duyệt (`phim-piano-v1`); chưa có tài khoản hoặc đồng bộ giữa các thiết bị. Tiến độ trên tên miền cloud không tự chuyển sang tên miền GitHub Pages.

Âm thanh được tổng hợp bằng Web Audio API. Phần luyện bài nhạc kiểm tra thứ tự cao độ, chưa đánh giá nhịp hoặc kỹ thuật. Phản hồi mở Google Forms do chủ website cung cấp.

## Nguồn import

Bản cloud phiên bản 6, source commit `1e03a8d84a8d8e1806daa03f7b48c08c92bf1e92`. Sáu file website được giữ nguyên nội dung và chuyển từ `dist/` ra thư mục gốc để phục vụ trực tiếp trên GitHub Pages. Các lần sửa trong GitHub và Sites cần được đồng bộ chủ động.


## Luồng học toàn màn hình

Mỗi bài đi theo 3 trang: đọc hiểu → kiểm tra → thực hành. Bài sau chỉ mở khi
mọi bài trước đã hoàn thành. Tiến độ bài hoàn thành cũ được giữ nguyên trên cùng
trình duyệt; trạng thái đang học đặt lại khi đóng bài hoặc tải lại trang.

`quiz-bank.js` chứa 72 câu song ngữ (6 câu cho mỗi bài), mỗi câu 4 lựa chọn và
một đáp án đúng. Vị trí lựa chọn được xoay ổn định, giữ nguyên khi đổi ngôn ngữ.
`lesson-flow.js` quản lý thứ tự trang, lựa chọn, kiểm tra, số lần sai và khóa bài.

Người học phải trả lời đúng cả 6 câu rồi hoàn thành chuỗi phím đàn. Sai tối đa
3 lần trong một lượt kiểm tra; lần sai thứ 4 quay lại trang đọc hiểu. Sau khi ôn,
nhấn bắt đầu kiểm tra để làm lại cả 6 câu với bộ đếm sai mới. Không tự chuyển
trang sau khi chọn: nhấn Kiểm tra, xem phản hồi, rồi nhấn Tiếp tục hoặc Thử lại.

Không dùng chấm tự luận hoặc gửi câu trả lời tới máy chủ. Tiến độ hoàn thành
lưu trong localStorage, không phải hệ thống xác thực chống gian lận.

Logo: `assets/piano-logo.png`. Bảng màu: `#FFA883`, `#FDE3C8`, `#FAF2E8`, `#6FC7E1`.

Kiểm tra:

```sh
node --test tests/lesson-flow.test.cjs
```
