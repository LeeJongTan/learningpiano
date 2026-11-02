# phím. — Hiểu rồi chơi

Website học piano bằng tiếng Việt và tiếng Anh, phục vụ trực tiếp bằng GitHub Pages.

## Khóa học

20 bài, 41 bước đọc ngắn và 120 câu trắc nghiệm (6 câu/bài). Lộ trình gồm bàn phím, cao độ, khóa Sol/Fa, dòng kẻ phụ, trường độ, nhịp, dấu hóa, quãng, gam, hợp âm ba, thế đảo, chấm dôi/nối, 6/8, hóa biểu G/F trưởng, sắc thái, dấu lặp và đọc đoạn nhạc hai ô. Mỗi bước có điều cần nhớ in đậm, hình minh họa và ví dụ nghe.

Luồng toàn màn hình: đọc từng bước → 6 câu hỏi → luyện đàn có gợi ý → kiểm tra chuỗi nốt → hoàn thành. Bài sau chỉ mở khi mọi bài trước đã hoàn thành. Các ID bài 1–12 được giữ nguyên để bảo toàn tiến độ cũ.

- Vị trí đáp án được trộn lại mỗi lượt mới; vị trí đáp án đúng của mỗi câu khác lượt trước. Cùng một lượt giữ nguyên thứ tự khi đổi ngôn ngữ hoặc tải lại.
- Cho phép 3 lỗi trắc nghiệm; lỗi thứ 4 mở đúng bước liên quan và đánh dấu các chủ đề cần ôn. Có thể kiểm tra lại trực tiếp sau khi ôn.
- Luyện đàn cho phép dò nốt, chưa tính hoàn thành. Kiểm tra yêu cầu đúng toàn bộ chuỗi trong một lượt, không giới hạn tốc độ. Một nốt sai dừng lượt; phải nhấn thử lại. Ba lượt sai đưa về luyện có gợi ý.
- Trình tự nốt được chấm ngay theo thứ tự thao tác, độc lập với việc trình duyệt cho phép âm thanh.
- Web chưa chấm nhịp, lực đánh, kỹ thuật ngón hoặc phối hợp hai tay. Bài Happy Birthday ở phòng tập tự do vẫn là chế độ có gợi ý; sao bài hát không mở khóa khóa học.

## Tiến độ và dữ liệu

Mục **Tiến độ của tôi / My progress** lưu tên hiển thị tùy chọn, bài hoàn thành, bài đang học, lựa chọn và lỗi của lượt trắc nghiệm, luyện đàn, sao bài hát, ngôn ngữ, âm lượng và cài đặt bàn phím.

Dữ liệu dùng localStorage `phim-piano-v1` trên **cùng trình duyệt và cùng tên miền**. Không có tài khoản/mật khẩu, database hay đồng bộ tự động. Tên là biệt danh hiển thị, không xác thực danh tính. Người chung trình duyệt có thể xem tiến độ. Xóa dữ liệu website hoặc chế độ riêng tư có thể làm mất dữ liệu. Nếu không ghi được dữ liệu, UI thông báo rõ.

Tải file sao lưu JSON để chuyển thủ công sang trình duyệt/thiết bị khác; khôi phục có màn hình xem trước và thao tác xác nhận. File được đọc tại trình duyệt, kiểm tra định dạng/giới hạn 256 KB và làm sạch dữ liệu. Dữ liệu học không được gửi vào GitHub hoặc biểu mẫu góp ý. Các trường không thuộc cấu trúc hợp lệ không được lưu lại. Đây không phải cơ chế chống gian lận.

Đóng/tải lại bài giữ bước đọc và lượt trắc nghiệm. Khi mở lại một lượt kiểm tra đàn đang chơi dở, chuỗi đàn bắt đầu lại từ nốt đầu để bảo đảm yêu cầu một lượt liên tục; số lượt sai và kết quả kiểm tra đã đạt vẫn được giữ.

Đổi tên miền (bao gồm đổi tài khoản GitHub Pages) không tự chuyển localStorage. Nếu còn truy cập được bản cũ có chức năng sao lưu, xuất file ở đó rồi nhập tại tên miền mới.

## Âm thanh và giao diện

Web Audio tổng hợp cao độ cơ bản cùng các họa âm nguyên. Âm trầm có mức tăng giới hạn và họa âm rõ hơn; đầu ra qua compressor. Thanh âm lượng dùng được cả trong bài học và phòng tập. Độ rõ thực tế còn phụ thuộc loa/tai nghe. Các ví dụ nhịp ở bài học dùng nốt đen làm đơn vị thời lượng trừ nơi ghi rõ; ví dụ đoạn nhạc ở bài 20 phát theo ♩=60.

Giữ logo `assets/piano-logo.png` của chủ website và bảng màu `#FFA883`, `#FDE3C8`, `#FAF2E8`, `#6FC7E1`. Có từ điển, metronome, Happy Birthday và hai Google Forms riêng cho báo lỗi / góp ý.

## Mã nguồn

- `index.html`, `styles.css`: khung và giao diện đáp ứng.
- `app.js`: UI, Web Audio, hình SVG và nối các luồng tương tác.
- `curriculum.js`: 12 bài gốc, bài hát thực hành.
- `course-extension.js`: 8 bài mới và 48 câu hỏi.
- `lesson-readings.js`: 41 bước đọc song ngữ và ví dụ gốc.
- `quiz-bank.js`: 72 câu hỏi gốc, liên kết bước ôn.
- `lesson-flow.js`: trạng thái bài, trộn đáp án, khóa bài, luyện/kiểm tra đàn.
- `learner-state.js`: kiểm tra dữ liệu, lưu/khôi phục cấu trúc tiến độ.
- `piano-audio.js`: thông số tăng độ rõ ở âm trầm.
- `locales.js`: bản dịch UI.

Không cần build hoặc cài thư viện. Để chạy trên máy, phục vụ thư mục gốc bằng static HTTP server. GitHub Pages dùng nhánh `main`, thư mục gốc. Tài liệu Google Docs là yêu cầu phát triển; không bị thay đổi trong lần triển khai này.

Kiểm tra bằng Node:

```sh
node --test tests/lesson-flow.test.cjs
```

17 nhóm kiểm tra bao gồm toàn bộ nội dung, đảo đáp án song ngữ, liên kết bước ôn, lỗi thứ 4, chặn nốt sai xen giữa, 3 lượt đàn sai, khóa bài, dữ liệu cũ, sao lưu/khôi phục và dựng đủ 41 hình. Kiểm tra giao diện bằng trình duyệt gồm desktop và khung 390×844; đây chưa phải thử nghiệm mọi thiết bị hoặc đánh giá hiệu quả sư phạm với người mới thật.

Nội dung và ví dụ được viết riêng cho website; có đối chiếu các khái niệm nền tảng với [ABRSM](https://www.abrsm.org/sites/default/files/2023-09/music-theory-syllabus-outline-grades-1-5-from-2020.pdf), [Steps to Music Theory](https://odp.library.tamu.edu/stepstomusictheory/chapter/compound-meters/) và [MuseScore Handbook](https://handbook.musescore.org/notation/repeats/repeat-signs). Khóa này không phải chương trình chứng chỉ ABRSM.

Bản ban đầu nhập từ Sites version 6; bản GitHub và bản Sites được quản lý riêng, không tự đồng bộ.

## Mobile navigation and multi-touch update

On phones, the Learning space button opens a vertical menu with readable labels and its own scroll area. The header stays visible while scrolling; desktop navigation also scrolls on short screens. Safari text autosizing is normalized without disabling page zoom.

`piano-input.js` handles each pointer independently, including non-primary fingers, on pointerdown. A legacy Touch Events fallback handles changedTouches. Pointer release/cancel, capture loss, page blur and navigation clear held-key highlights. Compatibility clicks are ignored while keyboard and assistive button activation remain available. Only the keys suppress browser touch gestures; the labeled rail above them scrolls the keyboard horizontally. Voices remain independent and the AudioContext resumes after interruption.

The Practice room includes the requested iPhone/iPad ringer reminder. The homepage hero contains the owner-supplied English quotation, Vietnamese translation and Beethoven credit.

Run all checks with `node --test tests/*.test.cjs` (23 test groups). Browser QA covers desktop, 390×844 and 320×360 layouts, menu navigation/scrolling, sound-note UI feedback, and a clean keyboard assessment without duplicate note input. Multi-finger event handling and interrupted audio recovery are tested in Node; physical iPhone/Safari multi-touch and actual audio output still require device testing.
