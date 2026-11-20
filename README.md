# Raiii — Blog kỹ thuật

Blog về 4G LTE, 5G NR, Linux và C, được build bằng Hugo với theme Stack và triển khai bằng GitHub Pages.

## Đăng bài từ trình duyệt

1. Mở **Viết bài mới** trên trang chủ để tạo một bản nháp, hoặc chọn **Viết bài** trong menu để mở lại bản nháp đã lưu. Trình soạn có thể nhập tệp Markdown có sẵn.
2. Kiểm tra tiêu đề, nội dung, ngày đăng và bản xem trước. Chọn **Chuẩn bị tệp đăng**. Trình soạn tải tệp `.md` cho bài thường hoặc gói ZIP cho bài có ảnh từ thiết bị.
3. Mở liên kết GitHub trong trình soạn. Tải tệp `.md` vào `content/post/`, hoặc giải nén ZIP rồi kéo thư mục bài viết vào `content/post/`. Commit vào `master` hoặc tạo pull request và gộp vào `master`.
4. Mở **Xem tiến độ triển khai**. Sau khi GitHub Actions hoàn tất, hãy mở trang chủ để kiểm tra bài theo ngày đăng.

Bản nháp và ảnh chèn từ thiết bị được lưu trong trình duyệt. Khi cập nhật một bài đã đăng, thay đúng tệp gốc và giữ `slug` hoặc `url` hiện tại. Nếu đổi bài cũ từ một tệp sang thư mục Hugo, kiểm tra các `relref` đang trỏ tới tệp gốc.

[Trình soạn Markdown](https://rainer24898.github.io/blog/viet-bai/) · [GitHub Actions](https://github.com/rainer24898/blog/actions/workflows/deploy.yml)

## Soạn bài trong repo

Cài Git, Go, Hugo, Dart Sass và Node.js 22.12 trở lên. Các phiên bản đang dùng để triển khai nằm trong [workflow](.github/workflows/deploy.yml).

```sh
npm ci
hugo new content --kind post post/ten-bai
hugo server --buildDrafts
```

Lệnh tạo `content/post/ten-bai/index.md` với tiêu đề, slug, ngày và thông tin bài viết. Thêm hình vào thư mục `images/` cạnh `index.md` và tham chiếu bằng Markdown, chẳng hạn `![Mô tả](images/so-do.png)`.

Đặt `draft: false` khi bài đã sẵn sàng. Kiểm tra `date` và `publishDate` nếu có trước khi build. Hugo mặc định bỏ qua bản nháp và bài có ngày đăng trong tương lai. [Tài liệu ngày đăng của Hugo](https://gohugo.io/methods/page/publishdate/)

```sh
hugo --gc --minify
```

Bản build nằm trong `public/`. Push commit lên `master` để GitHub Actions build và triển khai.

## Cập nhật theme

```sh
hugo mod get -u github.com/CaiJimmy/hugo-theme-stack/v4
hugo mod tidy
```
