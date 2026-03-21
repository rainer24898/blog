---
title: Sorting Algorithms
author: rainer
date: '2025-07-26T01:26:00+03:00'
categories: [C, Data structures and Algorithms]
tags: [C, Data structures and Algorithms]
math: true
mermaid: true
render_with_liquid: false
image: https://rainer24898.github.io/blog/assets/img/post/PUCCH/maxresdefault.jpg
---

# Tổng hợp các thuật toán sắp xếp

## 1. Sắp xếp là gì?

Sắp xếp (sorting) là quá trình đưa các phần tử của một dãy về một thứ tự xác định, thường là:

* tăng dần
* giảm dần
* theo khóa nào đó trong struct

Ví dụ:

* Ban đầu: `7 3 9 1 5`
* Tăng dần: `1 3 5 7 9`

Trong C, bài toán sắp xếp xuất hiện rất nhiều khi xử lý:

* mảng số nguyên
* danh sách bản ghi (`struct`)
* dữ liệu cần tìm kiếm nhị phân
* dữ liệu cần gom nhóm hoặc loại trùng

---

## 2. Phân loại thuật toán sắp xếp

Có nhiều cách phân loại:

### Theo vị trí lưu dữ liệu

* **Internal sorting**: dữ liệu đủ nằm trong RAM
* **External sorting**: dữ liệu quá lớn, phải dùng file/đĩa

### Theo cách thao tác

* **Comparison sort**: dựa trên phép so sánh (`<`, `>`)
  Ví dụ: Bubble Sort, Insertion Sort, Merge Sort, Quick Sort, Heap Sort
* **Non-comparison sort**: không dựa thuần vào so sánh
  Ví dụ: Counting Sort, Radix Sort, Bucket Sort

### Theo tính chất

* **Stable sort**: giữ nguyên thứ tự tương đối của các phần tử bằng nhau
* **Unstable sort**: không đảm bảo điều đó
* **In-place**: dùng rất ít bộ nhớ phụ
* **Out-of-place**: cần thêm bộ nhớ phụ đáng kể

---

## 3. Các độ phức tạp thường gặp

Khi đánh giá một thuật toán sắp xếp, thường quan tâm:

* **Best case**: trường hợp tốt nhất
* **Average case**: trung bình
* **Worst case**: xấu nhất
* **Memory usage**: bộ nhớ phụ
* **Stable hay không**

Một số mốc phổ biến:

* `O(n^2)`: chậm với dữ liệu lớn
* `O(n log n)`: rất phổ biến và hiệu quả
* `O(n + k)`: xuất hiện ở Counting Sort khi miền giá trị nhỏ

---

## 4. Bubble Sort

## Ý tưởng

<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Bubble-sort-example-300px.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>


Duyệt nhiều lượt qua mảng, mỗi lượt đưa phần tử lớn nhất chưa đúng vị trí “nổi lên” cuối dãy bằng cách đổi chỗ các cặp kề nhau.

Ví dụ:

`5 1 4 2`

* so sánh `5` và `1` -> đổi
* so sánh `5` và `4` -> đổi
* so sánh `5` và `2` -> đổi

Sau lượt đầu, `5` nằm cuối.

## Đặc điểm

* Dễ hiểu
* Dễ cài đặt
* Rất chậm với dữ liệu lớn

## Độ phức tạp

* Best: `O(n)` nếu có tối ưu cờ dừng
* Average: `O(n^2)`
* Worst: `O(n^2)`
* Stable: Có
* In-place: Có

## C code

```c
#include <stdio.h>

void bubble_sort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int swapped = 0;
        for (int j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                int tmp = a[j];
                a[j] = a[j + 1];
                a[j + 1] = tmp;
                swapped = 1;
            }
        }
        if (!swapped) {
            break;
        }
    }
}
```

---

## 5. Selection Sort

## Ý tưởng

<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Selection-Sort-Animation.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>


Mỗi lượt chọn phần tử nhỏ nhất trong đoạn chưa sắp xếp và đưa nó về đầu đoạn.

Ví dụ:

`64 25 12 22 11`

* lượt 1: chọn `11`, đổi với `64`
* lượt 2: chọn `12`, đổi với `25`
* ...

## Đặc điểm

* Số lần đổi chỗ ít hơn Bubble Sort
* Nhưng vẫn phải quét tìm min liên tục
* Không phù hợp dữ liệu lớn

## Độ phức tạp

* Best: `O(n^2)`
* Average: `O(n^2)`
* Worst: `O(n^2)`
* Stable: Không
* In-place: Có

## C code

```c
void selection_sort(int a[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int min_idx = i;
        for (int j = i + 1; j < n; j++) {
            if (a[j] < a[min_idx]) {
                min_idx = j;
            }
        }
        if (min_idx != i) {
            int tmp = a[i];
            a[i] = a[min_idx];
            a[min_idx] = tmp;
        }
    }
}
```

---

## 6. Insertion Sort

## Ý tưởng


<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Insertion-sort-example.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>

Xem phần bên trái là đã sắp xếp. Mỗi bước lấy một phần tử từ bên phải và chèn vào đúng vị trí trong phần đã sắp xếp.

Ví dụ:

`5 2 4 6 1 3`

* chèn `2` vào trước `5`
* chèn `4` vào giữa `2` và `5`
* ...

## Đặc điểm

* Rất tốt với mảng nhỏ
* Rất tốt khi dữ liệu gần như đã có thứ tự
* Nhiều thư viện thực tế dùng nó cho đoạn nhỏ trong hybrid sort

## Độ phức tạp

* Best: `O(n)`
* Average: `O(n^2)`
* Worst: `O(n^2)`
* Stable: Có
* In-place: Có

## C code

```c
void insertion_sort(int a[], int n) {
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;

        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}
```

---

## 7. Merge Sort

## Ý tưởng


<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Merge-sort-example-300px.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>

Dùng chiến lược **chia để trị**:

1. chia mảng thành 2 nửa
2. sắp xếp từng nửa
3. trộn (merge) hai nửa đã sắp xếp

Ví dụ:

`38 27 43 3 9 82 10`

* chia thành nhiều mảng con nhỏ
* sắp xếp từng mảng con
* merge lại theo thứ tự tăng dần

## Đặc điểm

* Hiệu năng ổn định
* Thường dùng khi cần stable sort
* Tốn thêm bộ nhớ phụ

## Độ phức tạp

* Best: `O(n log n)`
* Average: `O(n log n)`
* Worst: `O(n log n)`
* Stable: Có
* In-place: Không (bản chuẩn)

## C code

```c
void merge(int a[], int left, int mid, int right) {
    int n1 = mid - left + 1;
    int n2 = right - mid;

    int L[n1], R[n2];

    for (int i = 0; i < n1; i++) L[i] = a[left + i];
    for (int i = 0; i < n2; i++) R[i] = a[mid + 1 + i];

    int i = 0, j = 0, k = left;

    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            a[k++] = L[i++];
        } else {
            a[k++] = R[j++];
        }
    }

    while (i < n1) a[k++] = L[i++];
    while (j < n2) a[k++] = R[j++];
}

void merge_sort(int a[], int left, int right) {
    if (left >= right) return;

    int mid = left + (right - left) / 2;
    merge_sort(a, left, mid);
    merge_sort(a, mid + 1, right);
    merge(a, left, mid, right);
}
```

---

## 8. Quick Sort

## Ý tưởng

<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Quicksort-example.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>

Cũng là chia để trị:

1. chọn một **pivot**
2. chia mảng thành 2 phần:

   * nhỏ hơn pivot
   * lớn hơn hoặc bằng pivot
3. đệ quy sắp xếp hai phần

## Đặc điểm

* Trung bình rất nhanh
* Thực tế thường rất hiệu quả
* Worst case có thể rất xấu nếu chọn pivot tệ

## Độ phức tạp

* Best: `O(n log n)`
* Average: `O(n log n)`
* Worst: `O(n^2)`
* Stable: Không
* In-place: Gần như có, nhưng dùng stack đệ quy

## C code

```c
int partition(int a[], int low, int high) {
    int pivot = a[high];
    int i = low - 1;

    for (int j = low; j < high; j++) {
        if (a[j] < pivot) {
            i++;
            int tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }
    }

    int tmp = a[i + 1];
    a[i + 1] = a[high];
    a[high] = tmp;

    return i + 1;
}

void quick_sort(int a[], int low, int high) {
    if (low < high) {
        int pi = partition(a, low, high);
        quick_sort(a, low, pi - 1);
        quick_sort(a, pi + 1, high);
    }
}
```

## Lưu ý kỹ thuật

Quick Sort rất nhạy với cách chọn pivot:

* chọn phần tử đầu/cuối: đơn giản nhưng dễ dính worst case
* median-of-three: thực tế tốt hơn
* random pivot: giảm xác suất worst case

---

## 9. Heap Sort

## Ý tưởng

<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Heap_sort_example.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>

Dùng cấu trúc **heap**:

1. xây max-heap
2. đưa phần tử lớn nhất về cuối mảng
3. heapify lại phần còn lại

## Đặc điểm

* Không cần bộ nhớ phụ lớn như Merge Sort
* Worst case vẫn tốt hơn Quick Sort
* Nhưng locality bộ nhớ và hiệu năng thực tế thường không đẹp bằng Quick Sort tốt

## Độ phức tạp

* Best: `O(n log n)`
* Average: `O(n log n)`
* Worst: `O(n log n)`
* Stable: Không
* In-place: Có

## C code

```c
void heapify(int a[], int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;

    if (left < n && a[left] > a[largest]) largest = left;
    if (right < n && a[right] > a[largest]) largest = right;

    if (largest != i) {
        int tmp = a[i];
        a[i] = a[largest];
        a[largest] = tmp;
        heapify(a, n, largest);
    }
}

void heap_sort(int a[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--) {
        heapify(a, n, i);
    }

    for (int i = n - 1; i > 0; i--) {
        int tmp = a[0];
        a[0] = a[i];
        a[i] = tmp;
        heapify(a, i, 0);
    }
}
```

---

## 10. Counting Sort

## Ý tưởng

<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/Counting_Sort_Animation.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>

Không so sánh trực tiếp các phần tử. Thay vào đó, đếm số lần xuất hiện của từng giá trị.

Phù hợp khi:

* dữ liệu là số nguyên
* miền giá trị nhỏ

Ví dụ:

`4 2 2 8 3 3 1`

Ta tạo mảng đếm:

* `count[1] = 1`
* `count[2] = 2`
* `count[3] = 2`
* ...

## Độ phức tạp

* Time: `O(n + k)` với `k` là miền giá trị
* Stable: Có nếu cài đặt đúng kiểu prefix sum
* In-place: Không

## Nhược điểm

Nếu `k` quá lớn so với `n` thì tốn bộ nhớ, không hiệu quả.

---

## 11. Radix Sort

## Ý tưởng

<p align="center">
  <img
    src="/blog/assets/img/post/Sorting_Algorithms/radix.gif"
    alt="CSI demo"
    width="900"
    loading="lazy">
</p>

Sắp xếp theo từng chữ số, thường từ LSD đến MSD hoặc ngược lại, kết hợp với một stable sort như Counting Sort.

Ví dụ số thập phân:

* sắp xếp theo hàng đơn vị
* rồi hàng chục
* rồi hàng trăm

## Độ phức tạp

* Gần `O(d * (n + k))`
* `d`: số chữ số
* `k`: base hoặc miền giá trị chữ số

## Phù hợp khi

* số nguyên không âm
* chuỗi có độ dài cố định
* khóa có cấu trúc đều

---

## 12. So sánh nhanh các thuật toán

| Thuật toán     | Best        | Average     | Worst       | Stable | In-place |
| -------------- | ----------- | ----------- | ----------- | ------ | -------- |
| Bubble Sort    | O(n)        | O(n^2)      | O(n^2)      | Có     | Có       |
| Selection Sort | O(n^2)      | O(n^2)      | O(n^2)      | Không  | Có       |
| Insertion Sort | O(n)        | O(n^2)      | O(n^2)      | Có     | Có       |
| Merge Sort     | O(n log n)  | O(n log n)  | O(n log n)  | Có     | Không    |
| Quick Sort     | O(n log n)  | O(n log n)  | O(n^2)      | Không  | Gần như  |
| Heap Sort      | O(n log n)  | O(n log n)  | O(n log n)  | Không  | Có       |
| Counting Sort  | O(n + k)    | O(n + k)    | O(n + k)    | Có     | Không    |
| Radix Sort     | O(d(n + k)) | O(d(n + k)) | O(d(n + k)) | Có     | Không    |

---

## 13. Khi nào nên dùng thuật toán nào?

### Dữ liệu nhỏ

* Insertion Sort rất hợp
* Bubble/Selection chủ yếu để học

### Dữ liệu lớn, tổng quát

* Quick Sort: thường nhanh trong thực tế
* Merge Sort: tốt khi cần ổn định
* Heap Sort: tốt khi muốn worst case `O(n log n)` và ít bộ nhớ phụ

### Dữ liệu số nguyên, miền giá trị nhỏ

* Counting Sort

### Dữ liệu cần hiệu năng thư viện chuẩn

Nhiều thư viện thực tế không chỉ dùng một thuật toán đơn lẻ, mà dùng **hybrid sort**:

* Quick Sort + Heap Sort + Insertion Sort -> Introsort
* Merge Sort + Insertion Sort -> TimSort (rất nổi tiếng cho dữ liệu thực tế)

---

## 14. Stable sort là gì và vì sao quan trọng?

Giả sử có mảng bản ghi:

```c
struct Student {
    char name[32];
    int score;
};
```

Nếu hai sinh viên cùng `score = 90`, stable sort sẽ giữ nguyên thứ tự ban đầu của hai sinh viên đó.

Điều này rất quan trọng khi:

* sort nhiều khóa
* xử lý log
* xử lý dữ liệu nghiệp vụ

Ví dụ:

1. sort theo tên
2. sort tiếp theo điểm bằng stable sort

Kết quả cuối sẽ vừa đúng theo điểm, vừa giữ thứ tự tên trong nhóm điểm bằng nhau.

---

## 15. Ví dụ chương trình C hoàn chỉnh

```c
#include <stdio.h>

void print_array(const int a[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", a[i]);
    }
    printf("\n");
}

void insertion_sort(int a[], int n) {
    for (int i = 1; i < n; i++) {
        int key = a[i];
        int j = i - 1;
        while (j >= 0 && a[j] > key) {
            a[j + 1] = a[j];
            j--;
        }
        a[j + 1] = key;
    }
}

int main(void) {
    int a[] = {9, 4, 7, 3, 1, 5};
    int n = sizeof(a) / sizeof(a[0]);

    printf("Mang ban dau: ");
    print_array(a, n);

    insertion_sort(a, n);

    printf("Mang sau khi sap xep: ");
    print_array(a, n);

    return 0;
}
```

---

## 16. Tổng kết ngắn

* Thuật toán đơn giản để học: Bubble, Selection, Insertion
* Thuật toán mạnh dùng phổ biến: Quick, Merge, Heap
* Thuật toán đặc biệt cho dữ liệu số: Counting, Radix
* Không có thuật toán nào tốt nhất cho mọi tình huống
* Chọn thuật toán phụ thuộc vào:

  * kích thước dữ liệu
  * loại dữ liệu
  * yêu cầu stable
  * giới hạn bộ nhớ
  * worst case có quan trọng không

---

## 17. Gợi ý học theo thứ tự

Nên học theo lộ trình:

1. Bubble Sort
2. Selection Sort
3. Insertion Sort
4. Merge Sort
5. Quick Sort
6. Heap Sort
7. Counting Sort
8. Radix Sort

Trình tự này giúp đi từ trực quan đến tối ưu và từ comparison sort sang non-comparison sort.
