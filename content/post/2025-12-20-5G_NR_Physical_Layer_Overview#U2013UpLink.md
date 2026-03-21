---
title: 5G NR Physical Layer Overview – UpLink
author: rainer
date: "2025-07-22T01:26:00+03:00"
categories: [5G NR]
tags: [5G NR]
math: true
mermaid: true
render_with_liquid: false
---

# 5G NR Physical Layer Overview – Uplink

## 1. Mở đầu

Trong 5G NR, **uplink (UL)** là chiều truyền từ **UE → gNB**. Nếu downlink thường được nhìn từ góc độ “gNB phát dữ liệu xuống UE”, thì uplink lại có bản chất kỹ thuật khá khác:

* UE bị giới hạn công suất phát mạnh hơn nhiều so với gNB.
* Đồng bộ thời gian uplink khó hơn vì mỗi UE ở vị trí khác nhau, trễ lan truyền khác nhau.
* Dữ liệu uplink không chỉ có **user data**, mà còn có **UCI** (HARQ-ACK, SR, CSI), truy nhập ngẫu nhiên **PRACH**, và tín hiệu thăm dò kênh **SRS**.
* NR uplink phải cân bằng giữa:

  * hiệu suất phổ,
  * tiêu thụ công suất UE,
  * PAPR,
  * độ tin cậy,
  * khả năng scheduler điều phối nhiều UE đồng thời.

Vì vậy, kiến trúc uplink của NR không chỉ là “phiên bản ngược” của downlink, mà là một hệ thiết kế riêng với các lựa chọn waveform, reference signal, power control, timing advance, grant-based/grant-free, MIMO UL và cơ chế ghép UCI rất đặc thù.

---

## 2. Bản đồ tổng thể uplink trong NR

Ở mức physical layer, uplink của NR xoay quanh **4 thành phần chính**:

### 2.1. Physical channels

* **PUSCH** (*Physical Uplink Shared Channel*)
  Mang dữ liệu người dùng uplink và/hoặc UCI ghép kèm.

* **PUCCH** (*Physical Uplink Control Channel*)
  Mang UCI khi không gửi qua PUSCH, ví dụ HARQ-ACK, Scheduling Request, CSI.

* **PRACH** (*Physical Random Access Channel*)
  Dùng cho random access: UE phát preamble để xin vào hệ thống hoặc tái đồng bộ.

### 2.2. Physical signals

* **DM-RS** (*Demodulation Reference Signal*)
  Dùng để gNB ước lượng kênh và giải điều chế tín hiệu uplink.

* **PT-RS** (*Phase Tracking Reference Signal*)
  Hỗ trợ theo dõi nhiễu pha, quan trọng hơn khi điều chế bậc cao hoặc ở tần số cao.

* **SRS** (*Sounding Reference Signal*)
  Cho phép gNB “nghe thử” uplink channel để phục vụ link adaptation, scheduling, beam management, codebook/non-codebook MIMO, v.v.

---

## 3. Tư duy hệ thống: uplink đi qua những bước nào?

### 3.1. Luồng logic từ trên xuống dưới

```text
+-----------------------------+
| Higher layers / MAC         |
| - UL grant                  |
| - BSR / SR / HARQ process   |
| - CSI reporting decision    |
+--------------+--------------+
               |
               v
+-----------------------------+
| Transport channels          |
| - UL-SCH                    |
| - UCI bits                  |
| - RACH payload/preamble     |
+--------------+--------------+
               |
               v
+-----------------------------+
| Physical channels/signals   |
| - PUSCH + DMRS (+ PTRS)     |
| - PUCCH                     |
| - PRACH                     |
| - SRS                       |
+--------------+--------------+
               |
               v
+-----------------------------+
| OFDM / DFT-s-OFDM waveform  |
| Resource mapping on grid    |
| CP insertion / RF upconvert |
+--------------+--------------+
               |
               v
             Antenna
```

### 3.2. Góc nhìn thực chiến

Trong một slot uplink, UE có thể đồng thời hoặc luân phiên thực hiện các việc sau:

* phát **PUSCH** để gửi user data,
* chèn **UCI** vào PUSCH hoặc phát **PUCCH** riêng,
* phát **SRS** để gNB đo kênh,
* phát **PRACH** khi cần truy nhập/tái đồng bộ.

Điểm quan trọng là: **không phải mọi thứ đều tồn tại cùng lúc trong cùng một tài nguyên**, mà scheduler và cấu hình RRC/DCI quyết định tài nguyên nào dùng cho mục đích nào.

---

## 4. Nền tảng tài nguyên vật lý uplink

## 4.1. Numerology

NR dùng nhiều numerology khác nhau:

[
\Delta f = 15 \times 2^{\mu} \text{ kHz}, \quad \mu \in {0,1,2,3,4}
]

Ví dụ thường gặp:

* (\mu = 0) → 15 kHz
* (\mu = 1) → 30 kHz
* (\mu = 2) → 60 kHz
* (\mu = 3) → 120 kHz

Hệ quả trực tiếp:

* subcarrier spacing tăng → symbol ngắn hơn,
* slot ngắn hơn,
* phản ứng scheduler nhanh hơn,
* nhưng độ nhạy với phase noise/CFO và đặc tính RF thay đổi.

### 4.2. Frame / subframe / slot

Với normal CP, trực giác quan trọng là:

* 1 radio frame = **10 ms**
* 1 subframe = **1 ms**
* số slot trong 1 subframe = (2^{\mu})
* số slot trong 1 frame = (10 \cdot 2^{\mu})
* mỗi slot thường có **14 OFDM symbols**

### 4.3. Resource grid

Mỗi **PRB** gồm:

* **12 subcarriers** theo miền tần số
* kéo dài trên số OFDM symbol được cấp theo miền thời gian

Có thể hình dung một slot uplink như sau:

```text
Frequency ^
          |
PRB n+2   | [DMRS][DATA][DATA][DATA][DMRS][DATA]...
PRB n+1   | [DMRS][DATA][DATA][DATA][DMRS][DATA]...
PRB n     | [DMRS][DATA][DATA][DATA][DMRS][DATA]...
          +----------------------------------------> Time
             sym0 sym1 sym2 sym3 sym4 sym5 ...
```

Trong thực tế:

* một phần RE dành cho **DMRS**,
* có thể có **PTRS**,
* còn lại là **data RE** hoặc **UCI mapped on PUSCH**.

### 4.4. BWP trong uplink

UE không nhất thiết phát trên toàn bộ carrier. Thay vào đó, nó có thể chỉ làm việc trong một **UL BWP** (*Uplink Bandwidth Part*).

Ý nghĩa kỹ thuật:

* giảm độ phức tạp RF/baseband,
* tiết kiệm năng lượng,
* cho phép hệ thống linh hoạt đổi vùng băng thông hoạt động tùy trạng thái UE.

---

## 5. Uplink waveform: CP-OFDM và DFT-s-OFDM

Đây là một khác biệt rất quan trọng giữa uplink và downlink.

## 5.1. Vì sao uplink quan tâm đặc biệt đến waveform?

UE có PA hạn chế. Nếu waveform có **PAPR** cao, UE sẽ:

* phải back-off công suất nhiều hơn,
* hiệu suất PA giảm,
* vùng phủ hoặc chất lượng suy giảm.

Do đó uplink NR hỗ trợ các dạng waveform để cân bằng giữa linh hoạt tài nguyên và hiệu quả công suất.

## 5.2. CP-OFDM

Ưu điểm:

* linh hoạt resource mapping,
* thuận tiện cho MIMO và scheduling,
* tự nhiên với OFDM resource grid.

Nhược điểm:

* PAPR cao hơn.

## 5.3. DFT-s-OFDM (transform precoding)

Đây là tinh thần kế thừa từ SC-FDMA của LTE uplink.

Luồng trực giác:

```text
mod symbols -> DFT -> subcarrier mapping -> IFFT -> CP -> TX
```

Ưu điểm lớn:

* PAPR thấp hơn so với CP-OFDM,
* có lợi cho UE power efficiency.

Đổi lại:

* kém linh hoạt hơn ở một số cấu hình/tính năng,
* việc mapping và một số thủ tục phức tạp hơn.

## 5.4. Khi nào dùng cái nào?

Thực tế triển khai phụ thuộc:

* cấu hình cell,
* băng tần,
* năng lực UE,
* cấu hình PUSCH,
* mục tiêu giữa throughput và efficiency.

Một cách nhớ nhanh:

* **CP-OFDM**: linh hoạt hơn
* **DFT-s-OFDM**: thân thiện công suất UE hơn

---

## 6. PUSCH – kênh dữ liệu uplink quan trọng nhất

PUSCH là trung tâm của uplink data plane.

## 6.1. PUSCH mang gì?

PUSCH có thể mang:

* **UL-SCH**: dữ liệu user plane / higher layer data
* **UCI ghép kèm**:

  * HARQ-ACK
  * CSI part 1 / part 2

Trong nhiều trường hợp, khi UE đang phát dữ liệu uplink, việc nhét UCI vào PUSCH hiệu quả hơn là cấp riêng PUCCH.

## 6.2. PUSCH processing chain – bức tranh lớn

```text
TB bits
  |
  v
TB CRC attachment
  |
  v
Code block segmentation (if needed)
  |
  v
CB CRC attachment
  |
  v
LDPC encoding
  |
  v
Rate matching
  |
  v
Code block concatenation / bit selection
  |
  v
Scrambling
  |
  v
Modulation (QPSK / 16QAM / 64QAM / 256QAM)
  |
  v
Layer mapping
  |
  v
Transform precoding (optional)
  |
  v
Precoding / port mapping
  |
  v
Resource element mapping + DMRS/PTRS insertion
  |
  v
OFDM generation / RF transmission
```

## 6.3. Giải thích từng khối chính

### a) Transport block và CRC

MAC đưa xuống một **transport block (TB)**. PHY gắn thêm CRC để gNB kiểm tra lỗi sau khi decode.

### b) Code block segmentation

Nếu TB lớn, nó được chia thành nhiều **code block** để phù hợp bộ mã kênh.

### c) LDPC encoding

NR dùng **LDPC** cho dữ liệu trên UL-SCH.

Tại sao LDPC?

* hiệu năng tốt với block dài,
* song song hóa tốt trên hardware,
* phù hợp thông lượng cao của 5G.

### d) Rate matching

Sau mã hóa, số bit tạo ra chưa chắc khớp số RE thực tế được cấp. Rate matching làm nhiệm vụ “uốn” số bit đã mã hóa để vừa với tài nguyên khả dụng.

### e) Scrambling

Bit sau rate matching được XOR với chuỗi pseudo-random để:

* làm trắng phổ,
* giảm cấu trúc lặp bất lợi,
* hỗ trợ phân biệt user/cell/RNTI context.

### f) Modulation

Các lựa chọn thường là:

* QPSK
* 16QAM
* 64QAM
* 256QAM

Scheduler chọn MCS dựa trên chất lượng kênh, capability UE, chính sách cell.

### g) Layer mapping / precoding

Nếu uplink MIMO được dùng, symbol được ánh xạ lên nhiều layer, sau đó precoding sang antenna ports.

### h) Transform precoding (optional)

Nếu PUSCH cấu hình DFT-s-OFDM, khối transform precoding được bật trước resource mapping.

### i) RE mapping + DMRS/PTRS

Dữ liệu không chiếm toàn bộ grid. Một số RE được dành cho:

* DMRS để giải điều chế,
* PTRS để theo dõi phase.

## 6.4. PUSCH mapping type

PUSCH có các kiểu mapping thời gian khác nhau, thường được nhắc tới là **mapping type A/B**.

Tư duy đơn giản:

* khác nhau ở cách neo vị trí DMRS và data symbol trong slot/mini-slot,
* phục vụ các nhu cầu scheduling và latency khác nhau.

Đây là điểm rất hay gặp khi debug log PHY vì chỉ cần lệch mapping type hoặc DMRS position là decode hỏng ngay.

## 6.5. MCS, code rate và TBS

Với PUSCH, scheduler chọn:

* **MCS index**
* từ đó suy ra **modulation order** (Q_m)
* và **target code rate** (R)

Tư duy gần đúng về lượng bit hữu ích:

[
N_{info} \approx N_{RE,data} \cdot Q_m \cdot R \cdot v
]

Trong đó:

* (N_{RE,data}): số resource elements thực sự dành cho data
* (Q_m): số bit mỗi symbol điều chế
* (R): code rate mục tiêu
* (v): số layer

Nhưng **TBS thực tế không lấy trực tiếp bằng công thức xấp xỉ trên**, mà đi qua thủ tục chuẩn hóa trong spec:

1. xác định số RE khả dụng,
2. suy ra số bit khả dụng theo (Q_m), (R), số layer,
3. áp dụng quy tắc lượng tử hóa/làm tròn của chuẩn,
4. nhận được **TBS** cuối cùng.

## 6.6. UCI multiplexing trên PUSCH

Khi UE vừa gửi data vừa cần gửi control:

* HARQ-ACK,
* CSI,
* đôi khi SR theo ngữ cảnh,

thì UCI có thể được **multiplex lên PUSCH** thay vì phát PUCCH riêng.

Điểm khó ở đây là:

* UCI và UL-SCH phải tranh nhau tài nguyên RE/bit budget,
* chuẩn quy định thứ tự ưu tiên và cách mapping,
* nếu tính sai UCI multiplexing thì throughput, BLER hoặc ACK decode sẽ lỗi rất khó tìm.

## 6.7. PUSCH processing chain chi tiết – nhìn theo đúng thứ tự implementation

Nếu bóc đúng theo hướng implement PHY/TB pipeline, PUSCH UL-SCH thường nên được nhìn như sau:

```text
MAC TB
  -> TB CRC
  -> TBS / MCS consistency check
  -> code block segmentation
  -> CB CRC
  -> LDPC base graph selection
  -> LDPC encoding per CB
  -> rate matching per CB (depends on rv, E_r)
  -> code block concatenation
  -> UCI multiplexing / bit collection on PUSCH
  -> scrambling
  -> modulation
  -> layer mapping
  -> transform precoding (if enabled)
  -> precoding / antenna port mapping
  -> DMRS / PTRS / data RE mapping
  -> OFDM generation
  -> RF transmit
```

Có 3 lớp logic khác nhau nhưng thường bị lẫn vào nhau khi debug:

1. **bit-domain**
   CRC, segmentation, LDPC, rate matching, concatenation

2. **symbol-domain**
   scrambling, modulation, layer mapping, transform precoding

3. **resource-grid-domain**
   DMRS/PTRS insertion, RE mapping, OFDM symbol generation

Một bug hay gặp là team nhìn lỗi ở constellation hoặc BLER rồi chỉ chăm chăm vào phần symbol-domain, trong khi nguyên nhân thật lại nằm ở:

* chọn sai TBS,
* phân bổ sai số bit cho từng CB,
* sai `E_r` trong rate matching,
* hoặc sai UCI multiplexing budget.

## 6.8. MCS trên PUSCH – không chỉ là chọn modulation

### 6.8.1. MCS thực chất quyết định những gì?

Với PUSCH, **MCS index** không chỉ quyết định điều chế, mà kéo theo:

* **modulation order** `Qm`
* **target code rate** `R`
* gián tiếp quyết định:

  * TBS,
  * BLER kỳ vọng,
  * lựa chọn LDPC base graph,
  * hiệu suất phổ,
  * độ nhạy với lỗi kênh.

Tư duy đúng là:

```text
IMCS
  -> chọn bảng MCS phù hợp
  -> suy ra (Qm, R)
  -> kết hợp với N_RE và số layer v
  -> suy ra N_info / TBS
```

### 6.8.2. Không phải lúc nào cũng dùng cùng một bảng MCS

Trên PUSCH, bảng MCS phụ thuộc mạnh vào:

* transform precoding bật hay tắt,
* cấu hình higher layer,
* DCI format,
* capability như 256QAM,
* trường hợp đặc biệt như Msg3 / MsgA.

Một cách nhớ triển khai:

* **transform precoding disabled**
  thường đi theo logic bảng MCS kiểu PUSCH CP-OFDM thông thường

* **transform precoding enabled**
  thường dùng các bảng MCS riêng của PUSCH transform-precoded

* nếu cấu hình **qam64LowSE** hoặc **qam256** thì bảng dùng có thể đổi

* nếu bật **tp-pi2BPSK** thì vài entry MCS đầu có cách diễn giải `Qm` khác kiểu QPSK hoặc pi/2-BPSK

### 6.8.3. Góc nhìn scheduler

Scheduler thực ra đang giải bài toán:

```text
maximize throughput
subject to BLER target, power, coverage, latency
```

Nếu tăng `IMCS`:

* `Qm` tăng hoặc `R` tăng,
* TBS tăng,
* nhưng margin giảm.

Với uplink, bài toán này còn chịu thêm ràng buộc:

* UE power limit,
* DMRS overhead,
* UCI share budget,
* số layer uplink,
* transform precoding enable/disable.

### 6.8.4. Debug intuition

Nếu log cho thấy:

* cùng một grant size nhưng TBS nhảy bất thường,
* hoặc TBS không khớp giữa UE và gNB,

thì phải kiểm tra theo đúng thứ tự:

1. bảng MCS nào đang được chọn,
2. `IMCS` nào thực sự được giải mã từ DCI,
3. `Qm, R` có map đúng bảng đó không,
4. transform precoding state có đang làm đổi bảng không.

---

## 6.9. RE counting và TBS – phần dễ nhầm nhất của PUSCH

Đây là chỗ rất nhiều implementation bị lệch.

### 6.9.1. Bước 1: số RE data khả dụng trong mỗi PRB

Ở mức trực giác, số RE hữu dụng trên mỗi PRB trước khi nhân số PRB là:

```text
N_RE' = N_sc_RB * N_symb_sh - N_DMRS_PRB - N_oh_PRB
```

Trong đó:

* `N_sc_RB = 12`: số subcarrier mỗi PRB
* `N_symb_sh`: số OFDM symbol của PUSCH allocation
* `N_DMRS_PRB`: số RE bị DMRS chiếm trên mỗi PRB trong duration đó
* `N_oh_PRB`: overhead khác do higher-layer cấu hình, ví dụ `xOverhead`

Điểm cần nhớ:

* **DMRS overhead không chỉ là số symbol DMRS**, mà còn phụ thuộc:

  * DMRS configuration type,
  * number of CDM groups without data,
  * single-symbol hay double-symbol DMRS,
  * frequency hopping hay không.

### 6.9.2. Bước 2: tổng RE hữu dụng của allocation

Về trực giác:

```text
N_RE = min(156, N_RE') * n_PRB
```

Trong đó `n_PRB` là số PRB được cấp.

Con số **156** là điểm nhiều người quên, dẫn đến TBS lệch dù tưởng công thức đã đúng.

### 6.9.3. Bước 3: tính số information bits chưa lượng tử hóa

Sau khi biết số RE hữu dụng:

```text
N_info = N_RE * R * Qm * v
```

Trong đó:

* `R`: target code rate
* `Qm`: modulation order
* `v`: số layer

Đây mới chỉ là **intermediate value**, chưa phải TBS cuối cùng.

### 6.9.4. Bước 4: lượng tử hóa theo luật TBS của chuẩn

Chuẩn không lấy thẳng `TBS = N_info`.

Nó chia 2 miền:

#### Trường hợp 1: `N_info <= 3824`

* lượng tử hóa `N_info` xuống grid cho phép,
* rồi tra bảng TBS nhỏ.

Trực giác:

```text
N_info nhỏ
  -> làm tròn theo luật chuẩn
  -> tra bảng TBS
  -> ra TBS cuối cùng
```

#### Trường hợp 2: `N_info > 3824`

* lượng tử hóa theo luật khác,
* xét thêm điều kiện theo code rate,
* tính số code block cần thiết,
* rồi suy ra TBS theo công thức của chuẩn.

Đây là chỗ mà việc hiểu đúng:

* ngưỡng 3824,
* quy tắc làm tròn,
* số code block,
* và ngưỡng phụ theo code rate,

là rất quan trọng.

### 6.9.5. Tư duy kiểm tra nhanh ngoài thực tế

Nếu cần kiểm nhanh một grant PUSCH có hợp lý không, có thể dùng gần đúng:

```text
TBS_rough ~= N_RE_data * Qm * R * v
```

Sau đó so với TBS thực tế:

* nếu lệch ít -> thường do lượng tử hóa chuẩn
* nếu lệch lớn -> thường do một trong các lỗi sau:

  * đếm sai DMRS RE,
  * quên `xOverhead`,
  * chọn sai bảng MCS,
  * nhầm số layer,
  * quên cap 156 RE/PRB,
  * nhầm mapping duration L.

### 6.9.6. Ví dụ trực giác

Giả sử:

* allocation = 20 PRB
* PUSCH duration = 12 symbols
* 1 symbol DMRS
* mỗi PRB mất 6 RE vì DMRS theo cấu hình cụ thể nào đó
* không có overhead khác
* `Qm = 4` (16QAM)
* `R ~= 0.48`
* `v = 1`

Khi đó, gần đúng:

```text
N_RE' ~= 12 * 12 - 6 = 138
N_RE  ~= 138 * 20 = 2760
N_info ~= 2760 * 4 * 0.48 ~= 5299.2
```

Do `N_info > 3824`, TBS sẽ đi theo nhánh “large TBS”, không còn là tra bảng TBS nhỏ nữa.

Ví dụ này rất hữu ích để debug nhanh vì chỉ cần nhìn `N_info` là đã biết mình đang rơi vào nhánh nào của TBS procedure.

---

## 6.10. TB CRC, code block segmentation và CB CRC

### 6.10.1. TB CRC

Transport block từ MAC không đi thẳng vào LDPC.

Nó đi qua:

1. **TB CRC attachment**
2. rồi mới đến **code block segmentation**

Mục tiêu:

* giúp phát hiện lỗi ở mức transport block,
* chuẩn hóa input cho chuỗi mã hóa phía sau.

### 6.10.2. Vì sao phải segmentation?

LDPC encoder làm việc theo cấu trúc **code block**, không trực tiếp trên một TB lớn tùy ý.

Do đó nếu TB lớn:

* phải chia thành nhiều code block,
* mỗi code block được xử lý độc lập ở các bước sau.

### 6.10.3. CB CRC

Nếu có nhiều code block:

* mỗi CB sẽ được gắn thêm **CB CRC**,
* giúp decoder biết code block nào lỗi.

Ý nghĩa implementation rất lớn:

* cho phép xử lý song song nhiều CB,
* hỗ trợ HARQ / soft combining thuận lợi hơn,
* giúp pipeline hardware tách nhánh rõ ràng.

### 6.10.4. Một lỗi hay gặp

Nhiều người nhầm:

* **TB CRC** dùng để kiểm toàn bộ TB,
* **CB CRC** dùng để kiểm từng block con.

Nếu bỏ sót hoặc gắn sai thứ tự:

* LDPC encode/decode vẫn có thể “chạy”,
* nhưng CRC mismatch sẽ làm toàn chuỗi fail theo kiểu rất khó hiểu.

---

## 6.11. LDPC trên PUSCH – không chỉ là “mã hóa kênh”

### 6.11.1. NR dùng LDPC cho UL-SCH

PUSCH mang UL-SCH nên dữ liệu đi qua **LDPC**.

Mỗi code block được:

* chọn **base graph**,
* nâng kích thước theo **lifting size**,
* rồi encode thành chuỗi coded bits.

### 6.11.2. Chọn base graph như thế nào?

Tiêu chí chọn BG trong thực tế phụ thuộc chủ yếu vào:

* kích thước thông tin đầu vào `A`,
* target code rate `R`.

Trực giác:

* **BG2** thường dùng cho block nhỏ hơn hoặc code rate thấp hơn
* **BG1** thường dùng cho block lớn hơn hoặc throughput-oriented hơn

Một cách nhớ rất thực dụng:

```text
small block / low code rate   -> BG2
large block / higher code rate -> BG1
```

### 6.11.3. Tại sao chọn sai BG rất nguy hiểm?

Vì BG quyết định:

* kích thước ma trận kiểm tra chẵn lẻ,
* lifting size hợp lệ,
* số bit encoded output,
* behavior của rate matching,
* behavior của decoder phía thu.

Chỉ cần một phía dùng BG1 còn phía kia dùng BG2:

* toàn bộ decode gần như hỏng hoàn toàn,
* triệu chứng giống như sai scrambling hoặc sai RV.

### 6.11.4. Góc nhìn hardware/software

LDPC NR phù hợp cho:

* song song hóa cao,
* throughput lớn,
* pipeline phần cứng tốt.

Nhưng đổi lại, implementation phải cực kỳ chặt ở các điểm:

* chọn BG,
* lifting size,
* filler bits,
* mapping `E_r` cho từng CB,
* redundancy version.

---

## 6.12. Rate matching trên PUSCH – nơi nhiều bug “ẩn” nhất

### 6.12.1. Rate matching làm gì?

Sau LDPC encoding, số bit coded sinh ra chưa chắc khớp số bit mà tài nguyên PUSCH thực sự mang được.

Rate matching sẽ:

* lấy bit từ circular buffer,
* chọn vị trí bắt đầu tùy theo **redundancy version (RV)**,
* lấy đúng số bit `E_r` cho mỗi code block,
* thực hiện interleaving cần thiết.

### 6.12.2. Ý nghĩa của redundancy version

Mỗi lần HARQ retransmission có thể đổi **RV**.

Trực giác:

* RV khác nhau lấy các phần khác nhau của coded bit stream,
* decoder phía gNB sẽ soft-combine qua nhiều lần truyền,
* nhờ đó tăng xác suất decode thành công.

### 6.12.3. Lỗi implementation rất hay gặp

* tính sai `E_r` giữa các CB,
* chia bit budget không đều đúng luật chuẩn,
* dùng sai starting point theo RV,
* mismatch giữa số layer / `Qm` / total coded bits.

Triệu chứng thường thấy:

* initial transmission đôi khi pass,
* nhưng retransmission fail vô lý,
* hoặc BLER tăng rất mạnh ở grant sizes nhất định.

---

## 6.13. UCI multiplexing trên PUSCH – phần điều khiển chen vào data

Đây là đoạn rất dễ học thiếu vì người ta thường chỉ học UL-SCH path thuần data.

Nhưng thực tế PUSCH có thể mang đồng thời:

* **UL-SCH data**,
* **HARQ-ACK**,
* **CSI part 1**,
* **CSI part 2**,
* đôi khi cả **CG-UCI** trong các trường hợp configured grant.

### 6.13.1. Logic tổng quát

Chuỗi đúng nên được nhìn như sau:

```text
HARQ-ACK bits  -> encode / rate match -> Q'_ACK symbols per layer
CSI part 1     -> encode / rate match -> Q'_CSI1 symbols per layer
CSI part 2     -> encode / rate match -> Q'_CSI2 symbols per layer
UL-SCH         -> LDPC / rate match   -> remaining symbols
```

Tức là về bản chất, chuẩn không nói đơn giản kiểu “nhét thêm vài bit UCI vào data”, mà là:

* xác định trước **budget coded modulation symbols** cho từng loại UCI,
* sau đó mới dành phần còn lại cho UL-SCH.

### 6.13.2. Thứ tự ưu tiên trực giác

Về bản chất triển khai:

* **HARQ-ACK** thường là loại control nhạy nhất,
* tiếp theo là các phần CSI,
* **UL-SCH** dùng phần tài nguyên còn lại.

Điều này giải thích vì sao có những grant nhỏ mà:

* data throughput tụt mạnh,
* nhưng ACK vẫn cố được bảo toàn.

### 6.13.3. Tại sao UCI multiplexing khó?

Vì nó phụ thuộc đồng thời vào:

* payload size UCI,
* `Qm`, số layer,
* số data RE thực tế,
* repetition type,
* presence/absence của UL-SCH,
* loại CSI part 1 / part 2,
* number of coded modulation symbols per layer.

### 6.13.4. Góc nhìn debug

Khi thấy hiện tượng:

* ACK decode sai nhưng data vẫn đúng,
* hoặc CSI chỉ fail khi grant nhỏ,
* hoặc throughput tụt bất thường khi có CSI report,

thì khả năng cao nằm ở một trong các chỗ:

* tính sai `Q'_ACK`, `Q'_CSI1`, `Q'_CSI2`,
* sai thứ tự multiplexing,
* nhầm RE set dành cho UCI và UL-SCH,
* mismatch giữa phía UE và gNB trong thuật toán bit collection.

---

## 6.14. DMRS mapping trên PUSCH – chỗ sai một ly đi cả khối decode

### 6.14.1. DMRS quyết định khả năng giải điều chế

PUSCH data chỉ decode được nếu gNB có channel estimate đúng.

Do đó mọi thứ sau đây đều cực kỳ nhạy:

* DMRS configuration type 1 hay 2,
* single-symbol hay double-symbol,
* mapping type A hay B,
* `dmrs-AdditionalPosition`,
* CDM groups without data,
* antenna ports,
* intra-slot frequency hopping.

### 6.14.2. Mapping type A vs B – khác nhau ở đâu?

Cách nhớ nhanh:

* **mapping type A**: thiên về slot-based scheduling, DMRS neo theo vị trí kiểu slot logic
* **mapping type B**: thiên về mini-slot hoặc flexible start, DMRS bám theo allocation start thực tế hơn

Nếu team đang debug latency path hoặc mini-slot UL, mapping type B là chỗ cần soi đầu tiên.

### 6.14.3. DMRS configuration type 1 vs type 2

Khác biệt chủ yếu nằm ở:

* pattern RE trong miền tần số,
* số port hỗ trợ,
* cách dùng CDM groups,
* overhead hữu hiệu trên PRB.

Trực giác implementation:

```text
config type khác
-> pattern k khác
-> N_DMRS_PRB khác
-> N_RE data khác
-> TBS có thể khác
-> channel estimate behavior cũng khác
```

### 6.14.4. AdditionalPosition

`dmrs-AdditionalPosition` quyết định có chèn thêm DMRS symbol trong cùng allocation hay không.

Tăng DMRS symbol:

* tốt hơn cho channel tracking,
* nhất là khi allocation dài hoặc channel biến thiên nhanh,

nhưng đồng thời:

* tăng overhead,
* giảm data RE,
* làm TBS nhỏ đi.

### 6.14.5. Single-symbol vs double-symbol DMRS

* **single-symbol DMRS**: overhead thấp hơn
* **double-symbol DMRS**: robust hơn nhưng tốn tài nguyên hơn

Nếu một cấu hình chỉ đổi từ single sang double DMRS mà TBS hoặc BLER thay đổi mạnh, điều đó là hoàn toàn hợp logic.

### 6.14.6. Checklist debug DMRS

Khi PUSCH fail decode, hãy kiểm tuần tự:

1. mapping type A/B đúng chưa,
2. config type 1/2 đúng chưa,
3. front-loaded symbol count đúng chưa,
4. additionalPosition đúng chưa,
5. port set đúng chưa,
6. CDM groups without data đúng chưa,
7. frequency hopping có làm thay đổi pattern không,
8. `N_DMRS_PRB` dùng cho TBS có khớp DMRS mapping thực tế không.

Chỉ cần sai một mắt xích là sẽ dẫn đến cả:

* channel estimate sai,
* TBS sai,
* RE indexing sai.

---

## 6.15. Transform precoding – bản chất DFT-s-OFDM trên PUSCH

### 6.15.1. Transform precoding nằm ở đâu trong chain?

Nó xuất hiện **sau modulation / layer mapping** và **trước subcarrier mapping / OFDM generation**.

Luồng rút gọn:

```text
coded bits
  -> modulation symbols
  -> layer mapping
  -> DFT
  -> localized subcarrier mapping
  -> IFFT
  -> CP
```

### 6.15.2. Ý nghĩa vật lý

Nếu không bật transform precoding:

* waveform gần bản chất CP-OFDM uplink hơn,
* linh hoạt hơn cho nhiều cấu hình.

Nếu bật transform precoding:

* waveform mang tính single-carrier hơn,
* **PAPR thấp hơn**,
* thuận lợi hơn cho UE PA.

### 6.15.3. Transform precoding ảnh hưởng những gì?

Nó không chỉ ảnh hưởng waveform, mà còn kéo theo:

* bảng MCS có thể khác,
* khả năng dùng một số cấu hình DMRS bị ràng buộc hơn,
* RE/symbol processing chain khác,
* behavior của PTRS cũng khác theo cấu hình.

### 6.15.4. Một ràng buộc triển khai rất quan trọng

Khi transform precoding được bật, không phải mọi kết hợp resource allocation / DMRS configuration đều hợp lệ như lúc CP-OFDM uplink thông thường.

Vì vậy khi scheduler bật transform precoding, cần kiểm tra đồng thời:

* resource allocation type,
* DMRS type,
* DCI field liên quan transform precoder indicator,
* higher-layer configuration trong `pusch-Config`.

### 6.15.5. Lỗi hay gặp

* dimension DFT sai theo số subcarrier cấp phát,
* mismatch giữa localized mapping và số RB thực cấp,
* phía UE coi TP enabled nhưng phía gNB giả định disabled,
* scheduler cấp cấu hình DMRS không tương thích với TP.

Triệu chứng:

* constellation có dạng méo nhưng không giống lỗi RF thuần,
* EVM xấu vừa phải nhưng decode fail hàng loạt,
* chỉ fail ở một số MCS hoặc grant shapes,
* cùng channel conditions nhưng TP on fail, TP off pass.

---

## 6.16. Gộp tất cả lại – cách debug PUSCH có hệ thống

Khi một PUSCH transmission lỗi, hãy đi theo đúng thứ tự sau:

### Lớp 1: scheduling / grant

* allocation PRB, symbol start, length
* mapping type A/B
* MCS index
* RV
* number of layers
* transform precoding state

### Lớp 2: TBS / bit budget

* bảng MCS đúng chưa
* `Qm`, `R` đúng chưa
* `N_RE'`, `N_RE` đúng chưa
* DMRS overhead đúng chưa
* cap 156 đã áp chưa
* TBS có khớp cả hai phía chưa

### Lớp 3: channel coding

* TB CRC
* CB segmentation
* CB CRC
* BG selection
* rate matching per CB
* RV / `E_r`

### Lớp 4: UCI coexistence

* có HARQ-ACK không
* có CSI part 1/2 không
* bit/symbol budget có bị UCI ăn mất không
* UL-SCH còn đủ tài nguyên không

### Lớp 5: resource mapping

* DMRS type / ports / positions
* PTRS presence
* data RE indexing
* hopping

### Lớp 6: waveform / RF

* transform precoding path
* OFDM path
* timing advance
* power control
* CFO / phase noise / PA compression

Đây là thứ tự rất quan trọng, vì nếu đi ngược từ RF về mà bỏ qua TBS hoặc UCI multiplexing thì sẽ tốn rất nhiều thời gian debug.

---

## 6.17. Tóm tắt kỹ thuật một đoạn

> Chuỗi xử lý **PUSCH uplink** bắt đầu từ **TB + CRC**, đi qua **TBS/MCS-driven bit budget**, **code block segmentation**, **LDPC encoding**, **rate matching theo RV**, sau đó ghép thêm **UCI multiplexing** nếu cần, rồi **scrambling -> modulation -> layer mapping -> transform precoding (optional) -> DMRS/PTRS/data RE mapping -> OFDM**. Trong toàn chuỗi này, các lỗi hay gây fail nhất thường nằm ở **RE counting, TBS quantization, base graph selection, UCI symbol budgeting, DMRS overhead/mapping và transform-precoding state mismatch**.

---

## 7. PUCCH – kênh điều khiển uplink

PUCCH chuyên chở **UCI** khi không đi chung với PUSCH hoặc khi hệ thống muốn tách riêng control khỏi data.

## 7.1. UCI gồm những gì?

* **HARQ-ACK**: UE phản hồi ACK/NACK cho DL transmission
* **Scheduling Request (SR)**: UE xin uplink grant
* **CSI**: thông tin phản hồi chất lượng kênh

## 7.2. Các format PUCCH

NR định nghĩa nhiều format để tối ưu cho các trường hợp bit ít/nhiều và duration ngắn/dài.

### PUCCH Format 0

* rất ngắn,
* ít bit,
* thích hợp cho HARQ-ACK/SR nhỏ.

### PUCCH Format 1

* dài hơn format 0,
* vẫn dành cho ít bit,
* có thể tận dụng time diversity tốt hơn.

### PUCCH Format 2

* dùng cho payload UCI lớn hơn,
* duration ngắn.

### PUCCH Format 3

* duration dài hơn,
* cho lượng UCI lớn hơn.

### PUCCH Format 4

* hỗ trợ cấu hình linh hoạt hơn, kể cả với OCC trong một số trường hợp.

## 7.3. Cách nhớ nhanh

* **Format 0/1**: ít bit
* **Format 2/3/4**: nhiều bit hơn

## 7.4. PUCCH processing trực giác

```text
UCI bits
  |
  v
UCI encoding / bit processing
  |
  v
Scrambling / modulation
  |
  v
Sequence generation / spreading (tùy format)
  |
  v
Resource mapping
  |
  v
OFDM generation
```

PUCCH không chỉ là “PUSCH nhỏ đi”, mà có thiết kế riêng để đạt độ tin cậy cao cho control signaling.

## 7.5. Tầm quan trọng của PUCCH

Nếu PUCCH lỗi:

* gNB có thể không nhận được ACK,
* scheduler không biết UE có cần grant không,
* CSI sai/lost làm link adaptation kém,
* toàn bộ hiệu năng cell giảm dù user data path có vẻ vẫn hoạt động.

Trong vận hành mạng, các vấn đề “uplink control không ổn định” thường rất đau đầu vì chúng tạo hiệu ứng domino lên cả DL lẫn UL scheduling.

---

## 8. PRACH – cửa vào của uplink

PRACH là con đường để UE bắt đầu nói chuyện với mạng khi chưa có tài nguyên uplink thông thường.

## 8.1. PRACH dùng khi nào?

* truy nhập ban đầu vào cell,
* re-access,
* beam failure recovery,
* khi uplink timing chưa được căn chỉnh đầy đủ.

## 8.2. Ý tưởng random access

```text
UE                         gNB
 |--- PRACH preamble ----->|
 |<-- Random Access Resp --|
 |--- Msg3 on PUSCH ------>|
 |<-- Contention resolve --|
```

Các bước vật lý nổi bật:

* UE chọn hoặc được chỉ định preamble,
* phát trên tài nguyên PRACH occasion,
* gNB phát hiện preamble, ước lượng timing,
* trả về Random Access Response gồm UL grant và timing advance,
* UE dùng grant đó để gửi tiếp Msg3 trên PUSCH.

## 8.3. Vì sao PRACH là một thế giới riêng?

Vì tại thời điểm đó UE:

* chưa chắc đã được đồng bộ thời gian uplink,
* có thể chưa có grant thông thường,
* có thể đang ở trạng thái beam chưa chắc chắn,
* cần tín hiệu đủ “đặc biệt” để gNB phát hiện đáng tin cậy.

Do đó PRACH có thiết kế preamble, format, occasion, sequence riêng chứ không dùng lại PUSCH/PUCCH.

---

## 9. SRS – sounding reference signal

SRS là tín hiệu tham chiếu uplink do UE phát để gNB đo kênh uplink.

## 9.1. SRS trả lời câu hỏi gì cho gNB?

* kênh uplink tốt/xấu ở dải tần nào?
* UE phù hợp với beam nào?
* nên cấp bao nhiêu PRB?
* nên chọn MCS nào?
* UL MIMO có khả thi không?
* nên chọn port/layer/precoder nào?

## 9.2. Tại sao SRS quan trọng?

Không có SRS, gNB khó biết trạng thái kênh uplink theo miền tần số và không gian. Điều đó làm:

* scheduling bảo thủ hơn,
* link adaptation kém chính xác,
* MIMO/beamforming uplink kém hiệu quả.

## 9.3. Trực giác vị trí SRS

SRS thường nằm ở cuối slot hoặc theo các occasion cấu hình sẵn, chiếm tài nguyên riêng để đo kênh.

```text
slot: | DATA | DATA | DATA | SRS |
```

Dĩ nhiên vị trí thực tế phụ thuộc cấu hình RRC và numerology.

---

## 10. DMRS và PTRS trong uplink

## 10.1. DMRS – bắt buộc để giải điều chế

gNB muốn giải PUSCH/PUCCH thì phải ước lượng được kênh uplink. DMRS là “điểm neo” cho việc đó.

Chức năng:

* ước lượng biên độ/pha của kênh,
* equalization,
* hỗ trợ tách layer/port trong MIMO,
* hỗ trợ giải điều chế chính xác.

Sai vị trí DMRS, sai port, sai scrambling identity, sai mapping type → gần như chắc chắn decode lỗi.

## 10.2. PTRS – theo dõi phase

PTRS hữu ích khi:

* tần số cao hơn,
* phase noise đáng kể,
* điều chế bậc cao như 256QAM nhạy pha hơn.

Không phải cấu hình nào cũng cần PTRS, nhưng khi cần thì nó giúp giảm EVM hiệu dụng và cải thiện demodulation.

---

## 11. Power control uplink

Đây là phần cực kỳ quan trọng trong uplink vì UE là thiết bị giới hạn công suất.

## 11.1. Mục tiêu của power control

* tín hiệu tới gNB đủ mạnh để decode,
* nhưng không quá mạnh gây nhiễu UE khác,
* cân bằng giữa vùng phủ, BLER, pin và interference.

## 11.2. Tư duy công suất uplink

Uplink power control thường gồm:

* thành phần danh định do cell cấu hình,
* bù suy hao đường truyền (*pathloss compensation*),
* offset theo loại channel/signal,
* điều chỉnh động theo TPC command.

Trực giác chung:

[
P_{UL} \sim P_0 + \alpha \cdot PL + \text{offsets} + f(\text{TPC})
]

Trong đó:

* (P_0): mức công suất cơ sở
* (PL): pathloss
* (\alpha): hệ số bù pathloss
* TPC: lệnh điều chỉnh công suất từ mạng

## 11.3. Vì sao phần này hay gây lỗi thực tế?

Vì chỉ cần một trong các yếu tố sau cấu hình sai:

* pathloss reference signal,
* closed-loop adjustment,
* per-BWP/per-channel offset,
* maximum UE transmit power,

thì hệ quả có thể là:

* UL BLER tăng,
* PUCCH không ổn định,
* PUSCH throughput thấp,
* PRACH miss detection,
* nhiễu nội/ngoại cell tăng.

---

## 12. Timing advance – sống còn cho uplink OFDM

## 12.1. Vì sao uplink cần timing advance?

Trong OFDM, nếu nhiều UE phát đến gNB mà lệch thời gian quá nhiều, tín hiệu sẽ chồng lấn và phá trực giao giữa các symbol/subcarrier.

Do mỗi UE ở khoảng cách khác nhau nên gNB phải yêu cầu UE **phát sớm hơn một lượng phù hợp** để tín hiệu đến gNB đúng cửa sổ mong muốn.

## 12.2. Trực giác hoạt động

```text
UE ở gần  ---> phát trễ ít hơn
UE ở xa   ---> phát sớm hơn nhiều hơn
```

Hoặc nhìn từ gNB:

```text
Mục tiêu: mọi UE “đến nơi” gần như thẳng hàng theo thời gian
```

## 12.3. Timing advance xuất hiện ở đâu?

* trong random access response,
* trong các lệnh TA update khi UE đang connected.

Nếu TA sai:

* PUSCH/PUCCH có thể bị lệch cửa sổ thu,
* EVM và decode xấu đi,
* nhiều lỗi tưởng như “RF xấu” thực ra là timing xấu.

---

## 13. Scheduling uplink

## 13.1. Grant-based uplink

Đây là kiểu cổ điển và phổ biến.

Luồng cơ bản:

```text
UE cần gửi data
   |
   v
SR / BSR / scheduler decision
   |
   v
gNB gửi UL grant (DCI)
   |
   v
UE phát PUSCH đúng tài nguyên được cấp
```

Ưu điểm:

* gNB kiểm soát tốt interference,
* phân bổ tài nguyên hiệu quả,
* phù hợp phần lớn traffic.

## 13.2. Grant-free / configured uplink

Trong một số trường hợp low latency hoặc traffic định kỳ, UE có thể được cấu hình phát mà không cần chờ grant động cho từng lần.

Ưu điểm:

* giảm trễ,
* giảm signaling overhead.

Đổi lại:

* nguy cơ va chạm/tài nguyên kém tối ưu hơn tùy thiết kế.

---

## 14. HARQ trong uplink

## 14.1. Ý tưởng

UE phát PUSCH. gNB decode và phản hồi kết quả. Nếu lỗi, UE retransmit theo tiến trình HARQ.

## 14.2. Tại sao HARQ uplink quan trọng?

Vì uplink chịu:

* giới hạn công suất,
* fading,
* interference,
* scheduling dynamics.

HARQ giúp tăng độ tin cậy mà không phải luôn phát ở MCS quá thấp.

## 14.3. Nhìn ở góc implementation

Một lỗi uplink thường phải phân biệt:

* lỗi initial transmission do power/channel,
* lỗi retransmission scheduling,
* lỗi soft combining,
* lỗi ACK/NACK feedback path.

---

## 15. Uplink MIMO và beamforming

NR uplink không chỉ có SISO.

## 15.1. Những gì gNB cần biết để thu MIMO uplink tốt?

* channel estimate đáng tin cậy từ DMRS/SRS,
* số layer UE hỗ trợ,
* port/layer mapping đúng,
* precoding/beam phù hợp,
* timing/frequency alignment đủ tốt.

## 15.2. Thách thức uplink MIMO

So với downlink, uplink MIMO bị chi phối mạnh bởi:

* năng lực phần cứng UE,
* giới hạn công suất chia trên nhiều layer,
* tương quan kênh thực tế,
* độ chính xác SRS/DMRS,
* scheduler quyết định rank/layer.

## 15.3. Một trực giác quan trọng

Tăng số layer chưa chắc throughput tăng tương ứng, vì:

* mỗi layer có thể nhận ít công suất hơn,
* BLER có thể tăng,
* overhead reference signal tăng,
* điều kiện kênh không đủ tốt.

---

## 16. Quan hệ giữa PUSCH, PUCCH, PRACH, SRS

Đây là cách nên nhìn để không bị “học rời rạc”:

```text
PRACH : xin vào hệ thống / lấy đồng bộ ban đầu
PUCCH : gửi control uplink riêng
PUSCH : gửi data uplink + có thể ghép UCI
SRS   : cho gNB đo uplink channel để cấp phát tốt hơn
DMRS  : giúp gNB giải điều chế tín hiệu uplink thực tế
PTRS  : giúp bám phase khi cần
```

Hoặc nhìn theo vòng đời UE:

```text
[Chưa vào hệ thống]
   -> PRACH
[Đã được cấp tài nguyên]
   -> PUCCH để SR/HARQ/CSI
   -> PUSCH để gửi data
   -> SRS để gNB hiểu kênh UL tốt hơn
```

---

## 17. Chuỗi ví dụ hoàn chỉnh – từ UE có dữ liệu đến gNB nhận được

## 17.1. Trường hợp grant-based uplink thông thường

```text
1) UE có data ở MAC buffer
2) UE phát SR trên PUCCH (hoặc đã có grant trước đó)
3) gNB cấp UL grant qua DCI
4) UE chuẩn bị PUSCH:
   - lấy TB từ MAC
   - CRC
   - segmentation
   - LDPC
   - rate match
   - scramble
   - modulate
   - layer map / precoding
   - chèn DMRS/PTRS
   - OFDM / RF phát
5) gNB thu PUSCH, dùng DMRS để estimate channel
6) gNB equalize, demod, decode LDPC
7) gNB gửi HARQ feedback
```

## 17.2. Trường hợp random access

```text
1) UE chưa có UL grant bình thường
2) UE phát PRACH preamble
3) gNB phát hiện preamble, ước lượng timing
4) gNB trả Random Access Response + TA + UL grant
5) UE phát Msg3 trên PUSCH
6) gNB xử lý tiếp contention resolution
```

---

## 18. Những điểm khác biệt lớn giữa LTE UL và NR UL

## 18.1. Linh hoạt numerology

NR hỗ trợ nhiều SCS hơn, slot linh hoạt hơn, mini-slot và nhiều cấu hình thời gian hơn.

## 18.2. Waveform linh hoạt hơn

NR uplink không bị cố định tuyệt đối như LTE SC-FDMA theo cách nhìn phổ thông; nó hỗ trợ cấu hình linh hoạt hơn giữa CP-OFDM và DFT-s-OFDM tùy trường hợp.

## 18.3. UCI/PUCCH phong phú hơn

PUCCH của NR có nhiều format hơn để tối ưu nhiều kiểu payload và latency.

## 18.4. MIMO / beam / SRS phức tạp hơn

NR được thiết kế cho massive MIMO, beam-centric operation và dải tần cao hơn, nên uplink reference design cũng phong phú hơn đáng kể.

---

## 19. Những lỗi hay gặp khi debug uplink PHY

## 19.1. Lỗi đồng bộ thời gian

Triệu chứng:

* PRACH detect kém,
* PUSCH BLER cao,
* EVM xấu,
* lỗi chỉ xuất hiện ở UE xa hoặc mobility.

Nguồn gốc hay gặp:

* timing advance sai,
* cửa sổ thu sai,
* bù trễ pipeline sai.

## 19.2. Lỗi cấu hình DMRS

Triệu chứng:

* decode rớt hoàn toàn,
* CSI/RSSI có vẻ bình thường nhưng data không ra.

Nguồn gốc:

* sai port,
* sai DMRS type,
* sai vị trí symbol,
* sai scrambling identity,
* lệch mapping type A/B.

## 19.3. Lỗi UCI multiplexing trên PUSCH

Triệu chứng:

* data đôi khi đúng, ACK/CSI lúc đúng lúc sai,
* chỉ lỗi ở vài MCS hoặc vài grant size.

Nguồn gốc:

* tính sai bit budget,
* ưu tiên UCI/UL-SCH sai,
* mapping/rate matching UCI sai.

## 19.4. Lỗi power control

Triệu chứng:

* UE gần tốt, UE xa xấu,
* PUCCH fail nhiều hơn PUSCH hoặc ngược lại,
* BLER phụ thuộc load cell.

Nguồn gốc:

* (P_0), (\alpha), TPC, pathloss reference sai,
* UE chạm trần công suất.

## 19.5. Lỗi transform precoding / waveform path

Triệu chứng:

* chỉ fail ở cấu hình DFT-s-OFDM hoặc chỉ fail ở CP-OFDM,
* constellation méo lạ,
* throughput thấp bất thường.

Nguồn gốc:

* chuỗi DFT mapping sai,
* dimension sai,
* resource allocation không tương thích.

---

## 20. Cách đọc spec uplink đúng hướng

Khi học uplink NR, nên đọc theo trục sau:

### Bước 1: đọc bức tranh chung

* 38.201 / 38.202 để có view tổng quan PHY

### Bước 2: đọc cấu trúc kênh và tín hiệu

* 38.211:

  * PUSCH
  * PUCCH
  * PRACH
  * SRS
  * DMRS / PTRS

### Bước 3: đọc coding và bit processing

* 38.212:

  * UL-SCH
  * UCI on PUCCH
  * UCI multiplexing on PUSCH

### Bước 4: đọc control procedures

* 38.213:

  * power control
  * PUCCH/PUSCH procedures
  * timing advance
  * random access related PHY procedures

### Bước 5: đọc data procedures

* 38.214:

  * MCS
  * TBS
  * transform precoding related procedures
  * scheduling/data transmission procedures

Nếu đọc lẫn lộn, rất dễ bị rơi vào tình trạng “biết thuật ngữ nhưng không thấy luồng xử lý”.

---

## 21. Sơ đồ ASCII tổng kết uplink NR

```text
                         5G NR UPLINK (UE -> gNB)

        +----------------------------------------------------------+
        |                    UE MAC / Higher Layers                |
        |  Buffer status, SR need, CSI need, data pending, HARQ    |
        +------------------------------+---------------------------+
                                       |
                         +-------------+-------------+
                         |                           |
                         v                           v
                +----------------+           +----------------+
                |      UCI       |           |    UL-SCH      |
                | ACK/SR/CSI     |           | User Data      |
                +--------+-------+           +--------+-------+
                         |                            |
                         |                            |
                         |                    +-------v--------+
                         |                    | TB/CB + LDPC   |
                         |                    | Rate matching  |
                         |                    +-------+--------+
                         |                            |
                         |                    +-------v--------+
                         |                    | Scramble/Mod   |
                         |                    | Layer mapping  |
                         |                    +-------+--------+
                         |                            |
                         |                +-----------v------------+
                         |                | Transform precoding?   |
                         |                | (optional for PUSCH)   |
                         |                +-----------+------------+
                         |                            |
          +--------------v-------------+   +---------v-----------+
          |           PUCCH            |   |        PUSCH        |
          |  control-only transmission |   | data + optional UCI |
          +--------------+-------------+   +----------+----------+
                         |                            |
                         +-------------+--------------+
                                       |
                            +----------v----------+
                            | DMRS / PTRS insert  |
                            | Resource mapping    |
                            +----------+----------+
                                       |
                            +----------v----------+
                            | OFDM / DFT-s-OFDM   |
                            | CP + RF transmit    |
                            +----------+----------+
                                       |
                                       v
                                     gNB RX

   Separate UL functions:
   - PRACH : random access / initial UL entry
   - SRS   : sounding for UL channel-aware scheduling / MIMO / beam
```

---

## 22. Kết luận

Muốn hiểu đúng **5G NR Uplink Physical Layer**, cần nắm 3 ý lõi sau:

### Ý 1: Uplink không chỉ là “gửi data lên”

Nó là tổ hợp của:

* **PUSCH** cho data,
* **PUCCH** cho control,
* **PRACH** cho truy nhập,
* **SRS** cho sounding,
* **DMRS/PTRS** cho thu và bám pha.

### Ý 2: Uplink bị chi phối rất mạnh bởi hạn chế của UE

Khác downlink, uplink phải đặc biệt quan tâm tới:

* công suất phát UE,
* PAPR,
* timing advance,
* power control,
* resource efficiency.

### Ý 3: Muốn debug uplink tốt phải nhìn theo chuỗi end-to-end

Một lỗi uplink có thể nằm ở:

* grant/scheduling,
* TBS/MCS,
* LDPC/rate matching,
* DMRS position,
* transform precoding,
* power control,
* timing advance,
* UCI multiplexing,
* hoặc RF impairment.

Không nên chỉ nhìn riêng một block.

---

## 23. Gợi ý đào sâu tiếp

Sau bài overview này, nên đào sâu lần lượt theo thứ tự:

1. **PUSCH processing chain chi tiết**
   TBS, MCS, RE counting, LDPC, UCI multiplexing, DMRS mapping.

2. **PUCCH formats 0/1/2/3/4 chi tiết**
   Khi nào dùng format nào, sequence, payload size, hopping.

3. **PRACH chi tiết**
   Long/short preamble, occasion, RACH procedure, TA acquisition.

4. **SRS và UL channel sounding**
   Frequency-domain sounding, beam management, UL MIMO support.

5. **UL power control + timing advance**
   Đây là phần cực kỳ quan trọng khi làm implementation, integration và field debug.

---

## 24. Tóm tắt một câu

> **5G NR uplink** là hệ thống truyền từ UE lên gNB, trong đó **PUSCH mang data**, **PUCCH mang control**, **PRACH mở cửa truy nhập**, **SRS giúp gNB hiểu kênh uplink**, còn **DMRS/PTRS** giúp thu chính xác; toàn bộ hệ thống được ràng buộc chặt bởi **power control, timing advance, waveform choice và scheduling**.
