---
title: 5G NR Physical Layer Overview – Downlink
author: rainer
date: 2025-07-22 1:26:00 +0300
categories: [5G NR]
tags: [5G NR]
math: true
mermaid: true
render_with_liquid: false
image: 
---


# 5G NR Physical Layer Overview – Downlink

> Một bài viết kỹ thuật đi từ bức tranh lớn đến phần đào sâu nhất của downlink PHY trong 5G NR: **PDCCH / CORESET / Search Space**, **PDSCH processing chain**, **TBS / MCS / code rate**, cùng các sơ đồ ASCII đủ chi tiết để đọc spec, debug log và liên hệ implementation.

---

## Mục lục

1. [Mở đầu: Downlink PHY trong NR thực sự làm gì?](#1-mở-đầu-downlink-phy-trong-nr-thực-sự-làm-gì)
2. [Bức tranh lớn của luồng downlink](#2-bức-tranh-lớn-của-luồng-downlink)
3. [Khung thời gian – tần số: numerology, slot, RB, RE, BWP](#3-khung-thời-gian--tần-số-numerology-slot-rb-re-bwp)
4. [SSB / PBCH: UE đi vào hệ thống như thế nào](#4-ssb--pbch-ue-đi-vào-hệ-thống-như-thế-nào)
5. [Đào sâu PDCCH / CORESET / Search Space](#5-đào-sâu-pdcch--coreset--search-space)
6. [Đào sâu PDSCH processing chain](#6-đào-sâu-pdsch-processing-chain)
7. [TBS, MCS, modulation order, code rate](#7-tbs-mcs-modulation-order-code-rate)
8. [DM-RS, PT-RS, CSI-RS trong thực chiến downlink](#8-dm-rs-pt-rs-csi-rs-trong-thực-chiến-downlink)
9. [MIMO, beamforming, link adaptation, HARQ](#9-mimo-beamforming-link-adaptation-harq)
10. [Chuỗi suy luận của UE từ PDCCH đến PDSCH](#10-chuỗi-suy-luận-của-ue-từ-pdcch-đến-pdsch)
11. [Góc nhìn implementation và debug](#11-góc-nhìn-implementation-và-debug)
12. [Kết luận](#12-kết-luận)

---

## 1. Mở đầu: Downlink PHY trong NR thực sự làm gì?

Trong hướng **downlink**, trạm gốc **gNB** phải biến dữ liệu và tín hiệu điều khiển thành sóng vô tuyến sao cho **UE có thể tìm thấy cell, biết mình phải nghe ở đâu, nhận được dữ liệu, và giải điều chế chính xác trong môi trường fading đa đường**.

Nếu nhìn từ góc độ logic hệ thống, downlink PHY phải giải quyết đồng thời 4 bài toán:

* **đồng bộ và nhận diện cell**
* **phát thông tin broadcast tối thiểu**
* **điều khiển việc cấp phát tài nguyên**
* **truyền dữ liệu thực tế với hiệu suất cao**

Tương ứng với đó là các thành phần quen thuộc:

* **SSB = PSS + SSS + PBCH + PBCH DM-RS**
* **PDCCH** để mang **DCI**
* **PDSCH** để mang dữ liệu thực tế
* **DM-RS / PT-RS / CSI-RS** để hỗ trợ thu và đo đạc

Một cách nhớ rất hiệu quả là:

```text
SSB/PBCH giúp UE vào hệ thống
PDCCH nói UE phải nghe ở đâu
PDSCH mang dữ liệu thực tế
DM-RS/PT-RS giúp UE giải chính xác
CSI-RS giúp gNB tối ưu cách truyền về sau
```

---

## 2. Bức tranh lớn của luồng downlink

### 2.1 Luồng logic từ MAC đến không gian vô tuyến

```text
MAC / RLC / PDCP
      │
      ▼
Transport Block (TB)
      │
      ├─ TB CRC attach
      │
      ├─ Code block segmentation
      │
      ├─ Code block CRC
      │
      ├─ LDPC encode
      │
      ├─ Rate matching
      │
      ├─ Scrambling
      │
      ├─ Modulation (QPSK / 16QAM / 64QAM / 256QAM)
      │
      ├─ Layer mapping
      │
      ├─ Precoding / beamforming
      │
      ├─ Resource mapping onto REs
      │
      ├─ OFDM (IFFT + CP)
      │
      ├─ DAC / RF upconversion
      │
      ▼
    Antenna / Air interface
      │
      ▼
UE receiver does inverse operations
```

### 2.2 Bức tranh slot downlink đầy đủ hơn

```text
Time-domain in one slot (example)

sym:   0      1      2      3      4      5      6      7      8      9     10     11     12     13
     +------+------+------+------+------+------+------+------+------+------+------+------+------+------+
DL   |PDCCH |PDCCH |         PDSCH data region with embedded DM-RS / PT-RS / maybe CSI-RS            |
     +------+------+------+------+------+------+------+------+------+------+------+------+------+------+

Inside the PDSCH region:
- some REs are data
- some REs are DM-RS
- some REs may be PT-RS
- some REs may be punctured / reserved
```

### 2.3 Tư duy đúng khi học downlink NR

Downlink NR **không phải** chỉ là “OFDM + data”. Nó là chuỗi phụ thuộc:

```text
SSB/PBCH
  → UE sync + đọc MIB
  → biết cách theo dõi control ban đầu
  → giải PDCCH / DCI
  → suy ra allocation của PDSCH
  → dùng DM-RS để equalize
  → giải PDSCH
  → gửi ACK/NACK
  → gNB điều chỉnh MCS / beam / layers cho lần tới
```

---

## 3. Khung thời gian – tần số: numerology, slot, RB, RE, BWP

## 3.1 Numerology

NR định nghĩa:

```text
SCS = 15 × 2^μ kHz
```

Giá trị thường gặp:

* μ = 0 → 15 kHz
* μ = 1 → 30 kHz
* μ = 2 → 60 kHz
* μ = 3 → 120 kHz
* μ = 4 → 240 kHz

Hệ quả:

* SCS lớn hơn → symbol ngắn hơn
* slot ngắn hơn
* phù hợp trễ thấp hơn
* phù hợp FR2 hơn
* nhưng phase noise và implementation deadline khó hơn

### 3.2 Slot duration

Với normal CP:

* 1 slot = **14 OFDM symbols**
* thời lượng slot xấp xỉ:

```text
Tslot = 1 ms / 2^μ
```

Ví dụ:

* 15 kHz → 1 ms
* 30 kHz → 0.5 ms
* 60 kHz → 0.25 ms
* 120 kHz → 0.125 ms

### 3.3 Resource grid

Resource grid là lưới 2 chiều:

* trục ngang: thời gian
* trục dọc: tần số

Đơn vị cơ bản:

* **RE** = 1 subcarrier × 1 OFDM symbol
* **RB** = 12 subcarriers liên tiếp trong miền tần số

```text
Frequency ↑
          │  RE RE RE RE RE RE RE ...
          │  RE RE RE RE RE RE RE ...
          │  RE RE RE RE RE RE RE ...
          │
          └────────────────────────────────→ Time
               sym0 sym1 sym2 sym3 ...
```

### 3.4 Point A, CRB, PRB, VRB

Khi đọc spec hoặc log scheduler, thường gặp:

* **Point A**: mốc tham chiếu của common resource grid
* **CRB**: Common Resource Block
* **PRB**: Physical Resource Block thực tế dùng để phát
* **VRB**: Virtual Resource Block do scheduler dùng trước khi map sang PRB

Nhiều lỗi debug đến từ việc nhầm:

* cell-level indexing
* BWP-local indexing
* VRB-to-PRB mapping

### 3.5 BWP (Bandwidth Part)

Một UE không nhất thiết luôn xử lý toàn bộ carrier bandwidth. Thay vào đó UE có thể hoạt động trên **active BWP**.

Điều này giúp:

* giảm độ rộng FFT cần xử lý
* giảm complexity baseband
* tiết kiệm công suất UE
* linh hoạt theo dịch vụ

Tư duy đúng:

```text
Carrier bandwidth  ⊃  DL BWP  ⊃  actual scheduled PRBs
```

---

## 4. SSB / PBCH: UE đi vào hệ thống như thế nào

Khi UE vừa bật lên, nó chưa biết:

* cell nào đang ở gần
* timing chính xác
* frequency offset
* beam nào tốt nhất

Vì vậy gNB phát **SS/PBCH block (SSB)**.

### 4.1 SSB gồm những gì?

* **PSS**
* **SSS**
* **PBCH**
* **PBCH DM-RS**

### 4.2 SSB chiếm bao nhiêu tài nguyên?

Một SSB chiếm:

* **4 OFDM symbols**
* **240 subcarriers**

### 4.3 Ý nghĩa từng thành phần

* **PSS**: UE phát hiện cell và coarse timing
* **SSS**: UE xác định phần còn lại của cell identity
* **PBCH**: mang **MIB**
* **PBCH DM-RS**: hỗ trợ giải PBCH

### 4.4 Tại sao SSB quan trọng với beamforming?

Trong NR, đặc biệt ở FR2, gNB thường phát nhiều SSB trên nhiều beam khác nhau. UE đo các SSB này để chọn beam tốt nhất cho initial access.

```text
Beam #0 → SSB #0
Beam #1 → SSB #1
Beam #2 → SSB #2
...
UE đo RSRP/quality của từng SSB và chọn beam mạnh nhất
```

Chi tiết về kênh có thể đọc thêm tại: [5G NR SSB](https://rainer24898.github.io/posts/SSB/ "SSB")

---

## 5. Đào sâu PDCCH / CORESET / Search Space

Đây là phần nhiều người đọc spec thấy khó nhất, nhưng nếu hiểu đúng thì toàn bộ logic downlink sẽ sáng ra rất nhanh.

---

### 5.1 PDCCH là gì?

**PDCCH (Physical Downlink Control Channel)** là kênh điều khiển downlink mang **DCI (Downlink Control Information)**.

PDCCH trả lời câu hỏi:

* UE nào đang được cấp phát?
* dữ liệu nằm ở đâu?
* MCS là bao nhiêu?
* HARQ process nào?
* redundancy version nào?
* allocation theo thời gian ra sao?
* có phải uplink grant không?

Một cách nói ngắn gọn:

> **Nếu UE không giải được PDCCH thì UE gần như không thể biết phải nghe PDSCH ở đâu.**

---

### 5.2 Chuỗi xử lý PDCCH ở phía gNB

PDCCH không chỉ là “nhét DCI vào RE”. Chuỗi phát của nó có logic riêng:

```text
DCI payload
   ↓
CRC attachment
   ↓
CRC masking bằng RNTI
   ↓
Polar coding
   ↓
Rate matching
   ↓
Scrambling
   ↓
QPSK modulation
   ↓
REG/CCE mapping trong CORESET
   ↓
OFDM generation
```

Điểm cần nhớ:

* **PDCCH dùng Polar coding**, không dùng LDPC
* modulation của PDCCH là **QPSK**
* PDCCH nằm trong **CORESET**
* UE không “biết chắc vị trí ngay từ đầu”, mà phải **blind decode** theo **Search Space**

---

### 5.3 DCI là gì?

**DCI** là nội dung logic mà PDCCH mang.

Một số DCI format thường gặp:

* **DCI 1_0 / 1_1**: downlink scheduling assignment
* **DCI 0_0 / 0_1**: uplink grant

Với downlink, DCI thường chứa các thông tin như:

* frequency-domain assignment
* time-domain assignment
* MCS index
* NDI
* RV
* HARQ process number
* TPC / các field điều khiển khác
* antenna / precoding related fields trong các ngữ cảnh tương ứng

---

### 5.4 CRC masking bằng RNTI: tại sao UE biết DCI đó có phải của mình?

Sau khi gNB gắn CRC vào DCI, phần CRC được **mask bằng RNTI**.

Một số RNTI quan trọng:

* **SI-RNTI**: system information
* **RA-RNTI**: random access
* **C-RNTI**: UE-specific scheduling
* **P-RNTI**: paging
* **TC-RNTI**: temporary C-RNTI

Ở phía UE, sau khi blind decode các candidate, UE thử kiểm tra CRC theo các RNTI phù hợp với ngữ cảnh. Nếu CRC pass với RNTI của UE, đó mới là DCI hợp lệ dành cho UE đó.

---

### 5.5 CORESET là gì?

**CORESET (Control Resource Set)** là vùng tài nguyên mà PDCCH được phép đặt vào.

Khác LTE, NR không cố định control region ở đầu subframe một cách cứng. Thay vào đó, CORESET được cấu hình linh hoạt hơn.

Một CORESET xác định:

* nó nằm ở đâu trong miền tần số
* dài bao nhiêu symbol theo thời gian
* cách map/interleave control resource
* các tham số liên quan đến DM-RS/quasi co-location

### 5.6 Hình dung CORESET trong resource grid

```text
One slot, one BWP (simplified)

Frequency ↑

PRB 80 | [   data / reserved / other channels ...                           ]
PRB 79 | [   data / reserved / other channels ...                           ]
...    |
PRB 36 | [ CORESET ][ CORESET ][               PDSCH / others               ]
PRB 35 | [ CORESET ][ CORESET ][               PDSCH / others               ]
...    |
PRB 12 | [ CORESET ][ CORESET ][               PDSCH / others               ]
...    +------------------------------------------------------------------------→ Time
          sym0        sym1        sym2 sym3 sym4 ...
```

Một CORESET thường có:

* **duration** = 1, 2 hoặc 3 OFDM symbols
* **frequency resources** theo nhóm RB được cấu hình

Trong RRC, tần số của CORESET thường được biểu diễn dưới dạng bitmap mà mỗi bit đại diện cho **một nhóm 6 PRB**.

---

### 5.7 REG, REG bundle, CCE là gì?

Để hiểu PDCCH mapping, cần đi qua các đơn vị sau:

#### REG – Resource Element Group

Trong ngữ cảnh PDCCH, có thể hình dung một **REG** là tài nguyên của **1 RB × 1 OFDM symbol** trong CORESET, sau khi tính đến các RE dành cho PDCCH DM-RS.

#### REG bundle

Nhiều REG có thể được nhóm thành **REG bundle**.

Điều này hữu ích cho:

* interleaving
* robustness theo fading
* mapping control linh hoạt hơn

#### CCE – Control Channel Element

**1 CCE = 6 REG**

DCI sau khi mã hóa sẽ chiếm một số lượng CCE tùy theo **aggregation level**.

---

### 5.8 Aggregation Level (AL): vì sao PDCCH có AL1, AL2, AL4, AL8, AL16?

Aggregation level cho biết một PDCCH candidate chiếm bao nhiêu CCE:

* AL1 → 1 CCE
* AL2 → 2 CCE
* AL4 → 4 CCE
* AL8 → 8 CCE
* AL16 → 16 CCE

Ý nghĩa thực tế:

* AL thấp → ít tốn tài nguyên, nhưng kém robust hơn
* AL cao → tốn nhiều tài nguyên control, nhưng dễ giải hơn ở vùng sóng xấu

Tư duy vận hành:

```text
UE near cell center, SINR tốt
  → thường có thể dùng AL thấp

UE edge, fading mạnh, beam chưa đẹp
  → thường cần AL cao hơn
```

---

### 5.9 Search Space là gì?

Nếu CORESET trả lời câu hỏi **“PDCCH có thể nằm ở vùng nào?”**,
thì **Search Space** trả lời câu hỏi **“UE phải đi tìm PDCCH ở đâu, lúc nào, và thử bao nhiêu candidate?”**

Search Space định nghĩa:

* monitoring occasions theo slot/symbol
* CORESET nào được dùng để search
* số candidate cho từng aggregation level
* loại search: common hay UE-specific

---

### 5.10 Common Search Space và UE-Specific Search Space

#### Common Search Space (CSS)

Dùng cho các thông tin mà nhiều UE hoặc UE trong giai đoạn đầu cần giải, ví dụ:

* system information
* paging
* random access related control
* một số control chung

#### UE-Specific Search Space (USS)

Dùng cho scheduling riêng từng UE, thường gắn với **C-RNTI** khi UE đã connected.

Có thể hình dung:

```text
CSS  → "control chung / control ban đầu"
USS  → "control dành riêng cho UE cụ thể"
```

---

### 5.11 Blind decoding trong PDCCH

Đây là điểm làm PDCCH khó hơn PDSCH.

UE không biết trước chính xác DCI nằm ở candidate nào. Vì vậy UE phải:

1. dựa vào Search Space để xác định monitoring occasion
2. trong CORESET tương ứng, thử các candidate ở từng aggregation level
3. giải mã từng candidate
4. kiểm tra CRC với RNTI phù hợp
5. nếu pass CRC thì mới chấp nhận DCI đó

Sơ đồ trực quan:

```text
Search Space says:
  slot n, symbol set S, CORESET #1
  candidates:
     AL1 : 4 candidates
     AL2 : 2 candidates
     AL4 : 1 candidate

UE action:
  try candidate #0 @ AL1
  try candidate #1 @ AL1
  try candidate #2 @ AL1
  ...
  try candidate #0 @ AL2
  ...
  check CRC masked by C-RNTI / SI-RNTI / RA-RNTI ...
```

Điều này làm cho PDCCH receiver ở UE khá nặng về mặt xử lý, đặc biệt khi số blind decode hypothesis nhiều.

---

### 5.12 PDCCH DM-RS

Để UE có thể giải điều chế PDCCH, bản thân PDCCH cũng có **DM-RS** trong CORESET.

Vai trò của nó:

* channel estimation cho control channel
* coherent demodulation
* hỗ trợ thu ổn định trong môi trường fading

Nói cách khác:

* **PDSCH có DM-RS của PDSCH**
* **PDCCH cũng có DM-RS riêng của PDCCH**

---

### 5.13 Cách PDCCH dẫn đường cho PDSCH

Đây là logic cực kỳ quan trọng:

```text
PDCCH / DCI
   ├─ frequency-domain assignment
   ├─ time-domain assignment
   ├─ MCS index
   ├─ NDI
   ├─ RV
   ├─ HARQ process number
   └─ các field liên quan khác

=> UE từ đó suy ra toàn bộ cách thu PDSCH
```

Vì thế khi debug downlink, một nguyên tắc vàng là:

> **Sai PDCCH thường kéo theo sai toàn bộ PDSCH.**

---

### 5.14 Sơ đồ ASCII kỹ thuật cho PDCCH / CORESET / Search Space

```text
                           PDCCH logic in NR downlink

                 +-----------------------------------------+
                 |            Search Space config          |
                 |  - monitoring occasion                  |
                 |  - CORESET association                  |
                 |  - #candidates per AL                   |
                 |  - CSS / USS                            |
                 +-------------------+---------------------+
                                     |
                                     v
                 +-----------------------------------------+
                 |                CORESET                  |
                 |  Time: 1/2/3 OFDM symbols              |
                 |  Freq: configured PRB groups           |
                 +-------------------+---------------------+
                                     |
                         maps PDCCH candidates into
                                     |
                                     v
               +---------------------------------------------------+
               | REG -> REG bundle -> CCE -> candidate @ AL         |
               |                                                    |
               | AL1  = 1 CCE                                       |
               | AL2  = 2 CCE                                       |
               | AL4  = 4 CCE                                       |
               | AL8  = 8 CCE                                       |
               | AL16 = 16 CCE                                      |
               +-------------------+--------------------------------+
                                   |
                                   v
                     +-------------------------------+
                     | Blind decode + CRC w/ RNTI    |
                     | if pass => valid DCI found    |
                     +-------------------------------+
                                   |
                                   v
                     +-------------------------------+
                     | Decode PDSCH as instructed    |
                     +-------------------------------+
```

---

Chi tiết về kênh có thể đọc thêm tại: [5G NR PDCCH](https://rainer24898.github.io/posts/PDCCH/ "PDCCH")

## 6. Đào sâu PDSCH processing chain

Nếu PDCCH là “bản đồ”, thì **PDSCH** là “hàng hóa thực sự được giao”.

PDSCH mang phần lớn dữ liệu downlink thực tế:

* user plane data
* signaling data sau khi đã đi xuống lower layers
* paging/system info trong các ngữ cảnh tương ứng

---

### 6.1 Chuỗi xử lý đầy đủ của PDSCH

```text
Transport Block (TB)
    ↓
TB CRC attachment
    ↓
Code block segmentation
    ↓
Code block CRC attachment
    ↓
LDPC encoding
    ↓
Rate matching
    ↓
Code block concatenation / bit selection result
    ↓
Scrambling
    ↓
QAM modulation
    ↓
Layer mapping
    ↓
Precoding
    ↓
Resource element mapping
    ↓
OFDM generation (IFFT + CP)
    ↓
RF transmission
```

---

### 6.2 Transport Block là gì?

**Transport Block (TB)** là khối bit đầu vào của DL-SCH tại tầng PHY.

Nó thường đến từ MAC scheduler sau khi scheduler đã quyết định:

* UE nào được cấp phát
* bao nhiêu PRB
* bao nhiêu symbol
* MCS nào
* số layer bao nhiêu

Một grant downlink điển hình thường gắn với **1 TB**, còn trong một số cấu hình MIMO có thể có nhiều codeword tùy theo rank/layer setup.

---

### 6.3 TB CRC

Trước khi mã hóa, PHY gắn **TB CRC** vào cuối transport block.

Mục tiêu:

* giúp UE kiểm tra kết quả giải mã ở mức toàn TB
* là cơ sở cho ACK/NACK của HARQ ở mức transport block

---

### 6.4 Code block segmentation

TB có thể quá lớn để mã hóa thành một khối LDPC duy nhất. Khi đó TB được chia thành nhiều **code block (CB)**.

Logic tổng quát:

```text
Large TB
  → split into multiple code blocks
  → each CB gets its own CRC
  → each CB encoded independently by LDPC
```

Ý nghĩa thực tế:

* cho phép xử lý song song tốt hơn
* phù hợp với cấu trúc LDPC base graph
* khi debug decoder có thể thấy lỗi ở mức từng code block trước khi kết luận fail cả TB

---

### 6.5 Code Block CRC

Mỗi code block được gắn thêm **CB CRC**.

Điều này giúp:

* phát hiện lỗi ở mức block nhỏ hơn
* hỗ trợ decoder và rate recovery
* là một phần của quy trình chuẩn hóa channel coding

---

### 6.6 LDPC encoding

NR dùng **LDPC** cho DL-SCH và UL-SCH.

Đây là khác biệt lớn so với LTE dùng turbo coding cho data channel.

Lợi ích của LDPC:

* hiệu suất tốt cho block lớn
* phù hợp throughput cao
* dễ song song hóa hơn trên phần cứng
* rất hợp với accelerator hoặc SIMD pipeline

Trong triển khai thực tế, LDPC thường là một trong những khối nặng nhất của L1.

---

### 6.7 Rate matching

Sau LDPC, số bit mã hóa sinh ra chưa chắc trùng với số bit mà tài nguyên PDSCH thực tế có thể mang.

Vì vậy phải có **rate matching** để:

* chọn đúng số bit cần dùng
* puncture hoặc repeat khi cần
* ánh xạ khối bit mã hóa sang đúng số RE và modulation order được cấp

Tư duy đúng:

```text
Scheduler decides resource size
→ resource size defines available bit capacity
→ rate matching makes coded bits fit that capacity
```

---

### 6.8 Scrambling

Bit sau rate matching được **scramble**.

Mục đích:

* làm ngẫu nhiên mẫu bit
* tránh các pattern bất lợi
* hỗ trợ tính trực giao và đặc tính thống kê khi điều chế

---

### 6.9 Modulation

Bit được chuyển thành symbol phức:

* QPSK → 2 bit / symbol
* 16QAM → 4 bit / symbol
* 64QAM → 6 bit / symbol
* 256QAM → 8 bit / symbol

Ký hiệu thường dùng:

* **Qm** = số bit trên 1 modulation symbol

Ví dụ:

* QPSK → Qm = 2
* 16QAM → Qm = 4
* 64QAM → Qm = 6
* 256QAM → Qm = 8

---

### 6.10 Layer mapping

Nếu có nhiều layer MIMO, chuỗi symbol sau modulation sẽ được phân bổ lên các **layer**.

Ký hiệu thường dùng:

* **v** hoặc **ν** = số layer

Ví dụ:

* 1 layer → single-layer transmission
* 2 layer → spatial multiplexing bậc 2
* 4 layer → throughput cao hơn nếu kênh đủ tốt

---

### 6.11 Precoding

Sau layer mapping, các layer được map sang antenna port / antenna element thực qua **precoding**.

Vai trò của precoding:

* beamforming gain
* spatial multiplexing
* diversity
* phù hợp với PMI/RI/CQI mà UE phản hồi

---

### 6.12 Resource mapping

Đây là bước nhiều người hay nghĩ là đơn giản, nhưng thực tế rất quan trọng.

PDSCH **không** được đặt lên toàn bộ RE của vùng cấp phát, vì phải chừa chỗ cho:

* PDSCH DM-RS
* PT-RS
* CSI-RS chồng lấn nếu có
* RE bị puncture/reserved
* phần control/CORESET nếu có giao thoa thiết kế

Vì thế số RE thật sự usable để mang data luôn nhỏ hơn số RE lý thuyết.

---

### 6.13 OFDM generation

Sau khi có symbol đã map vào subcarrier/time position:

```text
frequency-domain REs
      ↓
IFFT
      ↓
add cyclic prefix
      ↓
time-domain waveform
```

Đây là bước tạo sóng OFDM thực sự để đưa ra RF chain.

Chi tiết về kênh có thể đọc thêm tại: [5G NR PDSCH](https://rainer24898.github.io/posts/PDSCH/ "PDSCH")

---

## 7. TBS, MCS, modulation order, code rate

Đây là phần rất quan trọng khi đọc spec, debug scheduler, hoặc đối chiếu log PHY/FAPI.

---

### 7.1 MCS là gì?

**MCS (Modulation and Coding Scheme)** quyết định hai thứ cốt lõi:

1. **modulation order** → Qm
2. **target code rate** → thường được biểu diễn dưới dạng số nguyên scale theo 1024

Ví dụ cách hiểu:

* MCS index không trực tiếp là throughput
* MCS index ánh xạ tới **Qm** và **R**
* từ đó mới suy ra **TBS** dựa trên tài nguyên thực cấp phát

---

### 7.2 Code rate trong NR nên hiểu thế nào?

Code rate trực giác:

```text
R ≈ information bits / coded bits
```

Trong MCS table của NR, target code rate thường được biểu diễn dạng:

```text
R = x / 1024
```

Ví dụ:

* nếu bảng ghi 490 thì target code rate xấp xỉ:

```text
R ≈ 490 / 1024 ≈ 0.4785
```

Lưu ý quan trọng:

> Code rate thực tế sau TBS rounding, segmentation và rate matching **có thể không đúng tuyệt đối bằng target code rate**, mà chỉ xấp xỉ quanh giá trị đó.

---

### 7.3 Mối quan hệ trực giác giữa MCS, Qm, R và throughput

```text
Higher MCS
  → usually higher Qm and/or higher R
  → higher throughput
  → but requires better channel quality
```

Ví dụ trực giác:

* QPSK + low R → rất robust nhưng tốc độ thấp
* 64QAM + medium/high R → throughput tốt hơn
* 256QAM + high R → throughput rất cao nhưng yêu cầu SINR tốt

---

### 7.4 Số RE usable cho PDSCH

Trước tiên cần biết có bao nhiêu RE thực sự dùng để mang data.

Với một allocation, ký hiệu gần đúng:

* `N_PRB` = số PRB được cấp
* `N_symb` = số OFDM symbol dành cho PDSCH
* `N_DMRS^PRB` = số RE trên mỗi PRB bị DM-RS chiếm
* `N_oh^PRB` = số overhead RE/PRB khác

Khi đó số RE usable trên mỗi PRB được hiểu gần đúng là:

```text
N_RE^PRB ≈ 12 × N_symb - N_DMRS^PRB - N_oh^PRB
```

Và tổng RE usable:

```text
N_RE ≈ N_PRB × N_RE^PRB
```

Trong thủ tục chuẩn, giá trị này còn có ràng buộc và làm tròn theo quy tắc của spec.

---

### 7.5 Công thức trực giác của số bit thông tin trước bước TBS rounding

Sau khi biết số RE usable, modulation order, code rate và số layer:

```text
N_info ≈ N_RE × Qm × R × ν
```

Trong đó:

* `N_RE` = số RE data usable
* `Qm` = số bit / modulation symbol
* `R` = target code rate
* `ν` = số layer

Đây là công thức trực giác rất quan trọng.

---

### 7.6 TBS là gì?

**TBS (Transport Block Size)** là kích thước transport block mà PHY thực sự sẽ mang trong allocation đó.

Nó **không đơn giản** bằng `N_info` do phải qua quy tắc:

* threshold nhỏ/lớn
* rounding theo bội số phù hợp
* lookup table với khối nhỏ
* cộng/trừ phần CRC và giới hạn segmentation

Vì vậy:

```text
N_info  -->  apply 38.214 TBS procedure  -->  TBS
```

---

### 7.7 Thủ tục TBS ở mức thực hành

Có thể nhớ theo 4 bước:

#### Bước 1: Tính `N_RE`

Từ:

* số PRB cấp phát
* số symbol cấp phát
* overhead của DM-RS/PT-RS/other reserved RE

#### Bước 2: Tính `N_info`

```text
N_info = N_RE × Qm × R × ν
```

#### Bước 3: Áp dụng quy tắc TBS của 38.214

* nếu `N_info` nhỏ → dùng nhánh small TB, có lookup/rounding đặc thù
* nếu `N_info` lớn → dùng nhánh large TB với các bước làm tròn và xét segmentation threshold

#### Bước 4: Thu được `TBS`

Sau đó TBS này sẽ là đầu vào của chuỗi TB CRC → segmentation → LDPC → ...

---

### 7.8 Công thức TBS nhánh lớn thường dùng khi phân tích log

Với **`N_info > 3824`**, quy trình thường được nhớ như sau:

```text
n = floor(log2(N_info - 24)) - 5
N_info' = max(3840, 2^n × round((N_info - 24) / 2^n))
```

Sau đó:

* nếu `R <= 1/4`:

```text
C = ceil((N_info' + 24) / 3816)
TBS = 8 × C × ceil((N_info' + 24) / (8 × C)) - 24
```

* nếu `R > 1/4` và `N_info' > 8424`:

```text
C = ceil((N_info' + 24) / 8424)
TBS = 8 × C × ceil((N_info' + 24) / (8 × C)) - 24
```

* nếu `R > 1/4` và `N_info' <= 8424`:

```text
TBS = 8 × ceil((N_info' + 24) / 8) - 24
```

### 7.9 Với `N_info <= 3824` thì sao?

Khi `N_info` nhỏ, spec dùng nhánh khác với lookup/rounding đặc thù.

Cách nhớ thực tế:

* small TB **không nên tự nhẩm kiểu tuyến tính đơn giản**
* khi debug chính xác, nên tra đúng quy trình TBS của spec hoặc dùng tool tính TBS bám chuẩn

Nếu chỉ cần trực giác:

* `N_info` được làm tròn về giá trị hợp lệ nhỏ hơn rồi ánh xạ sang TBS hợp lệ gần nhất

---

### 7.10 Ví dụ trực giác tính TBS

Giả sử:

* `N_PRB = 50`
* `N_symb = 10`
* sau khi trừ DM-RS và overhead, còn `N_RE^PRB ≈ 108`
* `Qm = 6` (64QAM)
* `R = 616/1024 ≈ 0.6016`
* `ν = 2`

Khi đó:

```text
N_RE ≈ 50 × 108 = 5400
N_info ≈ 5400 × 6 × 0.6016 × 2 ≈ 38984
```

Vì `N_info > 3824`, ta đi theo nhánh large TB để làm tròn và suy ra TBS thực tế.

Điều quan trọng ở đây không phải con số cuối cùng phải nhẩm tay thật nhanh, mà là hiểu:

```text
PRB / symbol / DM-RS / MCS / layers
        ↓
usable RE
        ↓
N_info
        ↓
TBS
        ↓
TB processing chain
```

---

### 7.11 MCS cao nhưng throughput vẫn thấp: vì sao?

Rất nhiều người mới học dễ nhầm:

> MCS cao thì throughput chắc chắn cao.

Thực tế còn phụ thuộc mạnh vào:

* số PRB được cấp
* số symbol data thực sự
* overhead DM-RS/PT-RS
* số layer
* beam quality
* HARQ retransmission
* fragmentation của scheduler

Ví dụ:

* UE A dùng MCS 24 nhưng chỉ được 10 PRB
* UE B dùng MCS 16 nhưng được 80 PRB và 2 layers

Kết quả có thể UE B vẫn throughput cao hơn nhiều.

---

### 7.12 Sơ đồ ASCII kỹ thuật cho PDSCH processing chain

```text
                    PDSCH processing chain (DL-SCH path)

     +------------------+
     |  Transport Block |
     +---------+--------+
               |
               v
     +------------------+
     |   TB CRC attach  |
     +---------+--------+
               |
               v
     +------------------------------+
     | Code block segmentation      |
     | + code block CRC attach      |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | LDPC encode per code block   |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | Rate matching                |
     | fit coded bits to resources  |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | Scrambling                   |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | Modulation (Qm)              |
     | QPSK / 16QAM / 64QAM / 256QAM|
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | Layer mapping (ν layers)     |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | Precoding / Beamforming      |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | RE mapping + DM-RS/PT-RS     |
     +---------------+--------------+
                     |
                     v
     +------------------------------+
     | OFDM (IFFT + CP)             |
     +------------------------------+
```

---

## 8. DM-RS, PT-RS, CSI-RS trong thực chiến downlink

## 8.1 DM-RS

**DM-RS (Demodulation Reference Signal)** là tín hiệu sống còn để UE giải điều chế chính xác control hoặc data channel.

### Vai trò

* channel estimation
* equalization
* coherent demodulation
* hỗ trợ tách layer trong MIMO

### DM-RS của PDSCH quan trọng ở đâu?

PDSCH DM-RS quyết định chất lượng:

* ước lượng kênh tức thời
* soft demodulation
* BLER thực tế

### Trade-off

DM-RS dày hơn:

* estimation tốt hơn
* phù hợp tốc độ cao / channel thay đổi nhanh / rank cao

Nhưng:

* tốn RE
* giảm throughput data thuần

---

## 8.2 PT-RS

**PT-RS (Phase Tracking RS)** hỗ trợ theo dõi lỗi pha, đặc biệt hữu ích khi:

* FR2
* phase noise mạnh
* dùng modulation cao như 256QAM

Vai trò:

* theo dõi common phase error
* cải thiện EVM thực tế
* giúp giải điều chế QAM bậc cao ổn định hơn

---

## 8.3 CSI-RS

**CSI-RS** chủ yếu phục vụ đo đạc và phản hồi CSI.

UE dùng CSI-RS để:

* đo CQI
* đo PMI
* đo RI
* beam measurement / beam reporting
* link adaptation và beam management

Cách nhớ:

```text
DM-RS  → để giải kênh đang nhận ngay lúc này
CSI-RS → để đánh giá kênh, chọn cách truyền cho tương lai gần
```

---

## 9. MIMO, beamforming, link adaptation, HARQ

## 9.1 MIMO downlink

Các khái niệm cần phân biệt:

* **layer**: luồng dữ liệu logic
* **antenna port**: khái niệm logic trong chuẩn
* **antenna element/array**: phần cứng thật
* **beam**: hướng phát do precoding tạo ra

Mục tiêu của MIMO downlink:

* tăng throughput bằng spatial multiplexing
* tăng coverage bằng beamforming gain
* tăng reliability bằng diversity

---

## 9.2 Link adaptation

gNB không dùng MCS cố định. Nó điều chỉnh theo phản hồi và thống kê:

* CQI
* RI
* PMI
* HARQ feedback
* BLER observed
* chất lượng beam

Tham số có thể được điều chỉnh:

* MCS
* số layer
* beam / precoding
* số PRB
* DM-RS density trong một số trường hợp

---

## 9.3 HARQ

Sau khi UE giải PDSCH:

* đúng → ACK
* sai → NACK

gNB retransmit với **RV** thích hợp.

Ý tưởng cốt lõi là **incremental redundancy**:

* không nhất thiết gửi lại y hệt toàn bộ dữ liệu cũ
* có thể gửi phần redundancy khác để UE kết hợp nhiều lần thu

---

## 10. Chuỗi suy luận của UE từ PDCCH đến PDSCH

Đây là chuỗi tư duy mà người làm debug cần thuộc lòng.

```text
1. UE biết active BWP và Search Space cần theo dõi
2. Tới monitoring occasion, UE search PDCCH trong CORESET tương ứng
3. UE blind decode các candidate theo từng aggregation level
4. CRC pass với RNTI phù hợp → nhận được DCI hợp lệ
5. Từ DCI, UE suy ra:
      - PRB allocation
      - time-domain allocation
      - MCS
      - HARQ process
      - RV
      - các tham số liên quan khác
6. UE thu PDSCH tại tài nguyên đã chỉ ra
7. Dùng PDSCH DM-RS để estimate channel
8. Equalization + demodulation + descrambling + rate recovery + LDPC decode
9. Kiểm tra CRC của TB
10. Gửi ACK/NACK lên uplink theo timing tương ứng
```

### Sơ đồ ASCII end-to-end

```text
                         NR Downlink end-to-end receive logic

        gNB side                                                UE side

+------------------+                                    +----------------------+
| Scheduler        |                                    | Search Space monitor |
| PRB/MCS/HARQ/... |                                    +----------+-----------+
+---------+--------+                                               |
          |                                                        v
          |                                            +----------------------+
          +--> build DCI ----------------------------->| Blind decode PDCCH   |
          |                                            | in CORESET           |
          |                                            +----------+-----------+
          |                                                       |
          |                                        CRC pass w/ RNTI? yes
          |                                                       |
          v                                                       v
+------------------+                                    +----------------------+
| PDCCH in CORESET |----------------------------------->| Parse DCI fields     |
+------------------+                                    +----------+-----------+
                                                                   |
          +--------------------------------------------------------+
          |
          v
+------------------+                                    +----------------------+
| Build PDSCH      |----------------------------------->| Receive PDSCH        |
| TB→LDPC→QAM→map  |                                    | using given resource |
+---------+--------+                                    +----------+-----------+
          |                                                        |
          v                                                        v
+------------------+                                    +----------------------+
| DM-RS / PT-RS    |----------------------------------->| Ch. est / equalize   |
+------------------+                                    +----------+-----------+
                                                                   |
                                                                   v
                                                        +----------------------+
                                                        | Demap / decode / CRC |
                                                        +----------+-----------+
                                                                   |
                                                                   v
                                                        +----------------------+
                                                        | ACK / NACK            |
                                                        +----------------------+
```

---

## 11. Góc nhìn implementation và debug

## 11.1 Những điểm dễ fail nhất ở PDCCH

Khi PDCCH fail, hãy kiểm tra theo thứ tự:

1. **active BWP đúng chưa?**
2. **CORESET frequency/time placement đúng chưa?**
3. **Search Space monitoring occasion đúng không?**
4. **candidate enumeration đúng chưa?**
5. **aggregation level có hợp lý không?**
6. **RNTI dùng để CRC check có đúng ngữ cảnh không?**
7. **DCI size / field packing có đúng version/config không?**
8. **PDCCH DM-RS mapping có khớp không?**
9. **beam/QCL assumptions có sai không?**

---

## 11.2 Những điểm dễ fail nhất ở PDSCH

1. **PRB allocation từ DCI parse sai**
2. **time-domain allocation sai**
3. **MCS index map sai Qm/R**
4. **DM-RS pattern không khớp**
5. **TBS tính sai**
6. **rate matching size sai**
7. **RV/NDI/HARQ process quản lý sai**
8. **layer / precoder / port mapping sai**
9. **reserved RE / puncturing không được trừ đúng**

---

## 11.3 Checklist debug khi throughput thấp hơn kỳ vọng

* số PRB được cấp có đủ lớn không?
* số symbol data thật sự có bị giảm do control/DM-RS/PT-RS không?
* MCS có bị conservative quá không?
* rank/layer có thấp hơn khả năng kênh không?
* BLER có cao dẫn đến nhiều HARQ retransmission không?
* beam có tối ưu chưa?
* có quá nhiều overhead từ CSI-RS hoặc control region không?
* BWP có đang giới hạn băng thông xử lý của UE không?

---

## 11.4 Checklist debug khi UE không decode được data dù grant có vẻ đúng

* UE có thật sự decode được PDCCH không, hay chỉ thấy candidate?
* DCI field parse có đúng format không?
* resource allocation có bị lệch CRB/PRB/BWP indexing không?
* DM-RS symbol position có khớp mapping type A/B không?
* số RE usable dùng để TBS/rate matching có đúng không?
* scrambling ID / RNTI / codeword setup có đúng không?
* LDPC decoder fail do kênh xấu hay do pipeline mapping sai?

---

## 11.5 Bảng tóm tắt cực ngắn để nhớ nhanh

| Thành phần   | Vai trò chính                   | Sai ở đây sẽ kéo theo gì?           |
| ------------ | ------------------------------- | ----------------------------------- |
| SSB/PBCH     | vào hệ thống, sync, MIB         | UE không attach nổi hoặc sync lỗi   |
| PDCCH        | báo grant / DCI                 | UE không biết nghe PDSCH ở đâu      |
| CORESET      | vùng chứa PDCCH                 | control misplacement                |
| Search Space | nơi và lúc UE phải search PDCCH | blind decode sai / miss DCI         |
| PDSCH        | data thực tế                    | mất throughput hoặc fail CRC        |
| DM-RS        | channel estimation              | BLER cao, equalization lỗi          |
| MCS/Qm/R     | throughput vs robustness        | TBS sai, rate matching sai          |
| HARQ         | reliability                     | lặp retransmission, throughput giảm |

---

## 12. Kết luận

Muốn hiểu sâu **5G NR Downlink PHY**, có 3 mạch tư duy cần nắm thật chắc:

### Mạch 1: Đồng bộ và vào hệ thống

```text
SSB → PSS/SSS → PBCH/MIB → UE biết cell và cấu hình nền
```

### Mạch 2: Điều khiển tài nguyên

```text
CORESET + Search Space → UE tìm PDCCH → DCI nói PDSCH nằm ở đâu
```

### Mạch 3: Truyền dữ liệu thực tế

```text
TBS / MCS / LDPC / DM-RS / layers / beamforming
→ quyết định throughput, BLER và hiệu suất thật
```

Nếu phải tóm gọn cả bài bằng một sơ đồ duy nhất, thì có thể nhớ như sau:

```text
                5G NR Downlink PHY - one picture summary

       [SSB/PBCH] ---> UE sync + cell ID + MIB
            |
            v
 [Search Space + CORESET] ---> UE monitors PDCCH candidates
            |
            v
 [PDCCH / DCI] ---> tells:
            |        - frequency allocation
            |        - time allocation
            |        - MCS
            |        - HARQ process / RV
            v
 [PDSCH] ---> TB CRC -> segmentation -> LDPC -> rate match -> QAM -> layers -> precoding
            |
            v
 [DM-RS / PT-RS] ---> channel estimation / phase tracking
            |
            v
 [UE decode] ---> CRC pass? ACK : NACK
            |
            v
 [gNB adapts] ---> MCS / beam / layers / scheduling for next transmissions
```

---

## Hướng đào sâu tiếp theo

Sau bài này, nên học tiếp theo thứ tự:

1. **DM-RS cho PDSCH: type A, type B, additional positions, CDM groups**
2. **DCI field-by-field: frequency assignment, time-domain assignment, RV, NDI**
3. **TBS calculator viết bằng C để đối chiếu log scheduler**
4. **Mapping PDCCH/PDSCH sang FAPI hoặc O-RAN L1 messages**
5. **Log-debug guide: từ grant đến BLER root cause**

---

## Tóm tắt một câu

**NR downlink PHY là cơ chế để gNB dùng control signaling, coding, modulation, OFDM và beamforming nhằm nói cho UE biết phải nghe ở đâu, rồi truyền dữ liệu xuống một cách thích nghi, tin cậy và hiệu quả trên lưới tài nguyên thời gian–tần số linh hoạt.**
