---
title: LTE Transmission Mode 9 (TM9)
author: rainer
date: '2026-03-06T01:26:00+03:00'
categories:
- 4G LTE
tags:
- 4G LTE
math: true
mermaid: true
render_with_liquid: false
image:
---

# LTE Transmission Mode 9 (TM9) — Tài liệu chi tiết từ CSI-RS đến PDSCH Decoding

> Tài liệu này trình bày theo đúng flow xử lý PHY của LTE-Advanced:
>
> **TM9 → CSI-RS → Channel Estimation → RI/PMI/CQI → Precoding → DM-RS → PDSCH → MIMO Equalization → LLR → Rate De-matching → HARQ Combining → Turbo Decoding**
>
> Mục tiêu là hiểu **vì sao từng khối tồn tại**, tín hiệu đi qua từng khối như thế nào, UE biết gì ở mỗi thời điểm, và các đại lượng \(H\), \(W\), \(G=HW\), RI, PMI, CQI liên hệ với nhau ra sao.

---

# Mục lục

- [LTE Transmission Mode 9 (TM9) — Tài liệu chi tiết từ CSI-RS đến PDSCH Decoding](#lte-transmission-mode-9-tm9--tài-liệu-chi-tiết-từ-csi-rs-đến-pdsch-decoding)
- [Mục lục](#mục-lục)
- [1. TM9 là gì?](#1-tm9-là-gì)
- [2. Vì sao LTE-Advanced cần TM9?](#2-vì-sao-lte-advanced-cần-tm9)
- [3. Bức tranh tổng thể của TM9](#3-bức-tranh-tổng-thể-của-tm9)
  - [Giai đoạn A — Quyết định cách truyền](#giai-đoạn-a--quyết-định-cách-truyền)
  - [Giai đoạn B — Decode transmission thực tế](#giai-đoạn-b--decode-transmission-thực-tế)
- [4. CSI-RS là gì?](#4-csi-rs-là-gì)
- [5. CSI-RS antenna port và physical antenna](#5-csi-rs-antenna-port-và-physical-antenna)
  - [5.1 Antenna port không đồng nghĩa physical antenna](#51-antenna-port-không-đồng-nghĩa-physical-antenna)
  - [5.2 CSI-RS ports trong Rel-10](#52-csi-rs-ports-trong-rel-10)
- [6. CSI-RS nằm ở đâu trong Resource Grid?](#6-csi-rs-nằm-ở-đâu-trong-resource-grid)
  - [6.1 Resource Element](#61-resource-element)
  - [6.2 Tại sao CSI-RS có thể sparse?](#62-tại-sao-csi-rs-có-thể-sparse)
- [7. CSI-RS periodicity và subframe configuration](#7-csi-rs-periodicity-và-subframe-configuration)
- [8. NZP CSI-RS và ZP CSI-RS](#8-nzp-csi-rs-và-zp-csi-rs)
  - [8.1 NZP CSI-RS](#81-nzp-csi-rs)
  - [8.2 ZP CSI-RS](#82-zp-csi-rs)
- [9. UE estimate channel H từ CSI-RS như thế nào?](#9-ue-estimate-channel-h-từ-csi-rs-như-thế-nào)
- [10. MIMO channel matrix H](#10-mimo-channel-matrix-h)
- [11. RI — UE quyết định số spatial layers như thế nào?](#11-ri--ue-quyết-định-số-spatial-layers-như-thế-nào)
  - [11.1 RI là gì?](#111-ri-là-gì)
  - [11.2 Không phải có 2 RX antennas thì RI luôn bằng 2](#112-không-phải-có-2-rx-antennas-thì-ri-luôn-bằng-2)
  - [11.3 Khi nào Rank 2 có lợi?](#113-khi-nào-rank-2-có-lợi)
  - [11.4 SVD để hiểu Rank](#114-svd-để-hiểu-rank)
  - [11.5 Rank được chọn dựa trên expected performance](#115-rank-được-chọn-dựa-trên-expected-performance)
- [12. PMI — UE chọn precoder như thế nào?](#12-pmi--ue-chọn-precoder-như-thế-nào)
  - [12.1 PMI là gì?](#121-pmi-là-gì)
  - [12.2 UE thử precoder](#122-ue-thử-precoder)
  - [12.3 PMI không nhất thiết chỉ tối đa signal power](#123-pmi-không-nhất-thiết-chỉ-tối-đa-signal-power)
  - [12.4 8-port CSI-RS và hai phần PMI](#124-8-port-csi-rs-và-hai-phần-pmi)
- [13. CQI — UE suy ra chất lượng PDSCH như thế nào?](#13-cqi--ue-suy-ra-chất-lượng-pdsch-như-thế-nào)
  - [13.1 CQI là gì?](#131-cqi-là-gì)
  - [13.2 CQI không bằng SINR](#132-cqi-không-bằng-sinr)
  - [13.3 UE phải dự đoán PDSCH decoding performance](#133-ue-phải-dự-đoán-pdsch-decoding-performance)
  - [13.4 Frequency-selective SINR](#134-frequency-selective-sinr)
  - [13.5 CQI và BLER](#135-cqi-và-bler)
- [14. Mối quan hệ thực sự giữa RI, PMI và CQI](#14-mối-quan-hệ-thực-sự-giữa-ri-pmi-và-cqi)
- [15. Ví dụ đầy đủ quá trình tính CSI](#15-ví-dụ-đầy-đủ-quá-trình-tính-csi)
  - [Candidate Rank 1](#candidate-rank-1)
  - [Candidate Rank 2](#candidate-rank-2)
- [16. eNodeB làm gì sau khi nhận RI/PMI/CQI?](#16-enodeb-làm-gì-sau-khi-nhận-ripmicqi)
- [17. Layer Mapping trước Precoding](#17-layer-mapping-trước-precoding)
- [18. Precoding là gì?](#18-precoding-là-gì)
- [19. Ý nghĩa toán học của x = Ws](#19-ý-nghĩa-toán-học-của-x--ws)
- [\\end{bmatrix}](#endbmatrix)
- [20. Từ physical channel H tới effective channel G = HW](#20-từ-physical-channel-h-tới-effective-channel-g--hw)
- [21. Tại sao chỉ biết H từ CSI-RS chưa đủ để decode PDSCH?](#21-tại-sao-chỉ-biết-h-từ-csi-rs-chưa-đủ-để-decode-pdsch)
- [22. DM-RS là gì?](#22-dm-rs-là-gì)
- [23. DM-RS antenna ports trong TM9](#23-dm-rs-antenna-ports-trong-tm9)
- [24. DM-RS giúp estimate effective channel như thế nào?](#24-dm-rs-giúp-estimate-effective-channel-như-thế-nào)
- [25. Rank-1: DM-RS và PDSCH](#25-rank-1-dm-rs-và-pdsch)
- [26. Rank-2: DM-RS và PDSCH](#26-rank-2-dm-rs-và-pdsch)
- [\\end{bmatrix}](#endbmatrix-1)
- [27. DM-RS multiplexing và channel interpolation](#27-dm-rs-multiplexing-và-channel-interpolation)
  - [27.1 Nhiều DM-RS ports phải phân biệt được nhau](#271-nhiều-dm-rs-ports-phải-phân-biệt-được-nhau)
  - [27.2 DM-RS không nằm trên mọi data RE](#272-dm-rs-không-nằm-trên-mọi-data-re)
  - [27.3 Time/frequency interpolation](#273-timefrequency-interpolation)
- [28. PDSCH Receiver Chain](#28-pdsch-receiver-chain)
- [29. MIMO Equalization](#29-mimo-equalization)
- [30. Zero-Forcing và hạn chế](#30-zero-forcing-và-hạn-chế)
- [31. MMSE Equalizer](#31-mmse-equalizer)
- [32. Ví dụ số Rank-2 với MMSE](#32-ví-dụ-số-rank-2-với-mmse)
- [33. Sau Equalizer: Layer De-mapping](#33-sau-equalizer-layer-de-mapping)
- [34. Soft Demodulation và LLR](#34-soft-demodulation-và-llr)
  - [34.1 LLR](#341-llr)
  - [34.2 LLR tận dụng noise estimate](#342-llr-tận-dụng-noise-estimate)
- [35. Descrambling](#35-descrambling)
- [36. Rate De-matching](#36-rate-de-matching)
  - [36.1 Receiver làm ngược](#361-receiver-làm-ngược)
- [37. HARQ Soft Combining](#37-harq-soft-combining)
  - [37.1 Incremental Redundancy trực giác](#371-incremental-redundancy-trực-giác)
- [38. Turbo Decoding](#38-turbo-decoding)
- [39. CRC, ACK và NACK](#39-crc-ack-và-nack)
- [40. CSI-RS vs CRS vs DM-RS](#40-csi-rs-vs-crs-vs-dm-rs)
- [41. Ví dụ End-to-End TM9 Rank-2](#41-ví-dụ-end-to-end-tm9-rank-2)
  - [41.1 Cấu hình](#411-cấu-hình)
  - [41.2 CSI-RS transmission](#412-csi-rs-transmission)
  - [41.3 CSI calculation](#413-csi-calculation)
  - [41.4 Scheduler](#414-scheduler)
  - [41.5 Coding chain](#415-coding-chain)
  - [41.6 Layer Mapping](#416-layer-mapping)
  - [41.7 Precoding](#417-precoding)
  - [41.8 Radio channel](#418-radio-channel)
  - [41.9 DM-RS](#419-dm-rs)
  - [41.10 FFT và Resource Extraction](#4110-fft-và-resource-extraction)
  - [41.11 Channel estimation](#4111-channel-estimation)
  - [41.12 MIMO equalization](#4112-mimo-equalization)
  - [41.13 Soft Demodulation](#4113-soft-demodulation)
  - [41.14 Layer de-map và descramble](#4114-layer-de-map-và-descramble)
  - [41.15 Rate recovery](#4115-rate-recovery)
  - [41.16 HARQ combining](#4116-harq-combining)
  - [41.17 Turbo decode](#4117-turbo-decode)
  - [41.18 CRC](#4118-crc)
- [42. Các điểm dễ nhầm](#42-các-điểm-dễ-nhầm)
  - [42.1 “TM9 = 8 antennas” là chưa đủ](#421-tm9--8-antennas-là-chưa-đủ)
  - [42.2 CSI-RS ports không bằng PDSCH DM-RS ports](#422-csi-rs-ports-không-bằng-pdsch-dm-rs-ports)
  - [42.3 Port không phải physical antenna](#423-port-không-phải-physical-antenna)
  - [42.4 CSI-RS không trực tiếp decode PDSCH](#424-csi-rs-không-trực-tiếp-decode-pdsch)
  - [42.5 CQI không phải SINR](#425-cqi-không-phải-sinr)
  - [42.6 RI không bằng “số antenna tối đa”](#426-ri-không-bằng-số-antenna-tối-đa)
  - [42.7 PMI không phải exact physical beam weight](#427-pmi-không-phải-exact-physical-beam-weight)
  - [42.8 DM-RS “được precoded giống PDSCH” cần hiểu ở logical antenna-port level](#428-dm-rs-được-precoded-giống-pdsch-cần-hiểu-ở-logical-antenna-port-level)
  - [42.9 (H) từ CSI-RS và (G) từ DM-RS không phải hai measurement có mục đích giống nhau](#429-h-từ-csi-rs-và-g-từ-dm-rs-không-phải-hai-measurement-có-mục-đích-giống-nhau)
- [43. Các công thức quan trọng](#43-các-công-thức-quan-trọng)
  - [43.1 Reference-signal channel estimation](#431-reference-signal-channel-estimation)
  - [43.2 MIMO channel](#432-mimo-channel)
  - [43.3 Precoding](#433-precoding)
  - [43.4 Precoded MIMO channel](#434-precoded-mimo-channel)
  - [43.5 Effective channel](#435-effective-channel)
  - [43.6 Receiver model](#436-receiver-model)
  - [43.7 MMSE](#437-mmse)
  - [43.8 Equalized layers](#438-equalized-layers)
  - [43.9 Spatial-rate intuition](#439-spatial-rate-intuition)
- [44. Sơ đồ tổng kết toàn bộ TM9](#44-sơ-đồ-tổng-kết-toàn-bộ-tm9)
- [45. Tài liệu 3GPP nên đọc](#45-tài-liệu-3gpp-nên-đọc)
  - [45.1 3GPP TS 36.211 — Physical Channels and Modulation](#451-3gpp-ts-36211--physical-channels-and-modulation)
  - [45.2 3GPP TS 36.212 — Multiplexing and Channel Coding](#452-3gpp-ts-36212--multiplexing-and-channel-coding)
  - [45.3 3GPP TS 36.213 — Physical Layer Procedures](#453-3gpp-ts-36213--physical-layer-procedures)
  - [45.4 3GPP TS 36.331 — RRC](#454-3gpp-ts-36331--rrc)
- [Phụ lục A — Cách nhớ TM9 bằng câu hỏi](#phụ-lục-a--cách-nhớ-tm9-bằng-câu-hỏi)
  - [CSI-RS](#csi-rs)
  - [RI](#ri)
  - [PMI](#pmi)
  - [CQI](#cqi)
  - [Precoding](#precoding)
  - [DM-RS](#dm-rs)
  - [MMSE](#mmse)
  - [LLR](#llr)
  - [HARQ](#harq)
  - [Turbo decoder](#turbo-decoder)
- [Phụ lục B — Một chuỗi công thức duy nhất](#phụ-lục-b--một-chuỗi-công-thức-duy-nhất)
- [Phụ lục C — Những câu hỏi tự kiểm tra](#phụ-lục-c--những-câu-hỏi-tự-kiểm-tra)
- [Phụ lục D — Ghi chú về mức độ trừu tượng](#phụ-lục-d--ghi-chú-về-mức-độ-trừu-tượng)
- [Kết luận](#kết-luận)

---

# 1. TM9 là gì?

**TM9 = Transmission Mode 9** trong LTE/LTE-Advanced.

TM9 được đưa vào từ LTE-Advanced Release 10 để hỗ trợ downlink MIMO nâng cao. Khi học TM9, không nên chỉ nhớ “TM9 hỗ trợ 8 layers” mà cần hiểu kiến trúc reference signal đã thay đổi như thế nào.

Điểm rất quan trọng của TM9 là sự phân chia nhiệm vụ giữa hai loại reference signal:

```text
CSI-RS
  ↓
Channel measurement
  ↓
CSI feedback

DM-RS
  ↓
Effective channel estimation
  ↓
PDSCH demodulation
```

Trong các transmission mode cũ, CRS có vai trò rất lớn đối với channel estimation. Khi hệ thống mở rộng lên nhiều antenna ports và cần beamforming linh hoạt, mô hình CRS trở nên kém hiệu quả hơn về overhead và khả năng biểu diễn beamformed transmission.

TM9 giải quyết vấn đề bằng cách dùng:

- **CSI-RS** cho measurement phục vụ CSI.
- **UE-specific DM-RS** cho PDSCH demodulation.
- **Precoding/beamforming** linh hoạt.
- **Spatial multiplexing** với nhiều layers.
- **DCI Format 2C** là format quan trọng cho TM9.
- Trong Rel-10, cấu hình CSI-RS có thể hỗ trợ đến **8 CSI-RS antenna ports**.

Một câu để nhớ:

> **TM9 tách việc “đo channel để quyết định cách truyền” khỏi việc “estimate channel để decode dữ liệu thực tế”.**

---

# 2. Vì sao LTE-Advanced cần TM9?

Giả sử một eNodeB chỉ có 2 transmit antennas.

Việc phát reference signal tương đối dày cho từng antenna có thể vẫn chấp nhận được.

Nhưng nếu mở rộng:

```text
2 TX
 ↓
4 TX
 ↓
8 TX
```

nếu mỗi antenna port đều phải có một reference pattern dày như CRS, số Resource Elements dành cho reference signal sẽ tăng và làm giảm số RE dành cho data.

Ngoài overhead, beamforming còn tạo ra một vấn đề khác.

Giả sử eNodeB có physical antenna array:

```text
A0 A1 A2 A3 A4 A5 A6 A7
```

eNodeB muốn tạo một beam theo hướng UE bằng cách điều chỉnh phase/amplitude giữa các antenna elements.

Nếu UE phải biết:

```text
physical channel của từng antenna
+
toàn bộ beamforming weights
```

thì receiver sẽ phức tạp và signalling cũng không hiệu quả.

TM9 sử dụng UE-specific DM-RS để UE nhìn thấy trực tiếp **effective channel** sau precoding/beamforming.

Do vậy UE có thể decode mà không cần biết chi tiết implementation vật lý của array.

---

# 3. Bức tranh tổng thể của TM9

Hãy chia TM9 thành hai giai đoạn lớn.

## Giai đoạn A — Quyết định cách truyền

```text
eNodeB
   |
CSI-RS
   |
   v
UE
   |
estimate channel
   |
   v
RI / PMI / CQI
   |
   v
eNodeB scheduler
   |
choose:
- Rank
- Precoder
- MCS
- PRBs
```

Giai đoạn này trả lời:

> **PDSCH nên được truyền như thế nào?**

---

## Giai đoạn B — Decode transmission thực tế

```text
eNodeB
   |
PDSCH + DM-RS
   |
radio channel
   |
   v
UE
   |
DM-RS channel estimation
   |
   v
effective channel
   |
   v
MIMO equalization
   |
   v
PDSCH symbols
   |
   v
LLR
   |
   v
Turbo decoding
```

Giai đoạn này trả lời:

> **PDSCH vừa nhận được phải được giải điều chế như thế nào?**

Hai giai đoạn liên hệ với nhau nhưng không phải một.

---

# 4. CSI-RS là gì?

**CSI-RS = Channel State Information Reference Signal.**

Đây là downlink reference signal được thiết kế để UE đo channel phục vụ việc tạo CSI feedback.

CSI thường liên quan ba đại lượng quan trọng:

```text
RI  = Rank Indicator
PMI = Precoding Matrix Indicator
CQI = Channel Quality Indicator
```

Có thể diễn giải bằng ba câu hỏi:

| CSI | Câu hỏi |
|---|---|
| RI | Bao nhiêu spatial layers phù hợp? |
| PMI | Precoder/codebook entry nào phù hợp? |
| CQI | Link có thể chạy modulation/coding mạnh đến đâu? |

CSI-RS không phải user data.

UE biết trước structure/sequence và resource configuration của CSI-RS, do đó có thể so sánh tín hiệu phát đã biết với tín hiệu nhận được để estimate channel.

---

# 5. CSI-RS antenna port và physical antenna

Đây là một khái niệm rất quan trọng và thường bị nhầm.

## 5.1 Antenna port không đồng nghĩa physical antenna

Trong LTE:

> **Antenna port là một logical concept ở PHY.**

Nó được định nghĩa theo khả năng suy ra channel giữa các RE thuộc cùng antenna port.

Do đó không nên viết:

```text
port 15 = physical antenna 15
```

Một antenna port có thể được tạo bởi một tổ hợp nhiều physical antenna elements.

Ví dụ:

```text
Physical array

A0   A1   A2   A3
 \    |   |   /
  \   |   |  /
   Beamforming
       |
       v
Logical CSI-RS port
```

UE không nhất thiết biết mapping nội bộ này.

---

## 5.2 CSI-RS ports trong Rel-10

Rel-10 cho phép số CSI-RS ports:

```text
1
2
4
8
```

Đối với 8-port CSI-RS:

```text
ports 15 ... 22
```

Có thể minh họa:

```text
CSI-RS port 15  --------\
CSI-RS port 16  ---------\
CSI-RS port 17  ----------\
CSI-RS port 18  -----------\
                            ---> UE
CSI-RS port 19  -----------/
CSI-RS port 20  ----------/
CSI-RS port 21  ---------/
CSI-RS port 22  --------/
```

Nếu UE có nhiều receive antennas, UE có thể estimate một MIMO channel matrix từ các logical TX ports đến các RX antennas.

---

# 6. CSI-RS nằm ở đâu trong Resource Grid?

## 6.1 Resource Element

Một Resource Element:

```text
1 subcarrier
×
1 OFDM symbol
```

Nếu nhìn resource grid:

```text
Frequency
   ↑

   | . . . . . . . .
   | . . C . . . . .
   | . . . . . C . .
   | . . . . . . . .
   | C . . . . . . .
   |
   +------------------→ time
```

`C` là CSI-RS.

CSI-RS được thiết kế **sparse**, tức không chiếm dày đặc tất cả OFDM symbols/subcarriers.

---

## 6.2 Tại sao CSI-RS có thể sparse?

CSI-RS chủ yếu phục vụ measurement.

UE không cần CSI-RS ở mọi data RE.

Channel thường có correlation theo:

- frequency;
- time.

Do đó UE có thể đo tại một số RE đã biết rồi suy ra đặc tính channel trên vùng thích hợp.

Điều này giảm overhead đáng kể so với việc phát reference signal quá dày.

---

# 7. CSI-RS periodicity và subframe configuration

CSI-RS cũng không nhất thiết xuất hiện ở mọi subframe.

Trong Rel-10, periodicity có thể là:

```text
5 subframes  = 5 ms
10 subframes = 10 ms
20 subframes = 20 ms
40 subframes = 40 ms
80 subframes = 80 ms
```

Bảng cơ bản:

| `I_CSI-RS` | Periodicity |
|---:|---:|
| 0–4 | 5 ms |
| 5–14 | 10 ms |
| 15–34 | 20 ms |
| 35–74 | 40 ms |
| 75–154 | 80 ms |

Offset được suy ra theo nhóm.

Ví dụ:

```text
I_CSI-RS = 20
```

20 nằm trong:

```text
15 ... 34
```

nên:

```text
T_CSI-RS = 20 subframes
```

và:

```text
Delta_CSI-RS = 20 - 15 = 5
```

Có thể hình dung CSI-RS xuất hiện tại:

```text
SF 5
SF 25
SF 45
SF 65
...
```

trên global subframe timeline phù hợp.

Điểm cần nhớ:

> **CSI-RS resource configuration xác định “ở đâu trong grid”, còn subframe configuration xác định “khi nào xuất hiện”.**

---

# 8. NZP CSI-RS và ZP CSI-RS

## 8.1 NZP CSI-RS

**NZP = Non-Zero-Power CSI-RS.**

Đây là CSI-RS thực sự có năng lượng phát.

```text
RE
+----------+
| CSI-RS   |
| energy   |
+----------+
```

UE dùng NZP CSI-RS để estimate channel.

---

## 8.2 ZP CSI-RS

**ZP = Zero-Power CSI-RS.**

Tên gọi có vẻ nghịch lý vì “reference signal” nhưng zero power.

Thực chất đây là một resource pattern mà serving cell được cấu hình không phát data trên các RE tương ứng.

```text
RE
+----------+
|  muted   |
+----------+
```

ZP CSI-RS rất hữu ích khi cần tạo RE “trống” phục vụ interference coordination hoặc measurement.

Ví dụ hai cells:

```text
Cell A:
CSI-RS transmitted
       |
       v
same RE position

Cell B:
muted / ZP
```

Nhờ vậy measurement từ Cell A có thể tránh bị PDSCH mạnh của Cell B đè đúng vào RE đó trong cấu hình phối hợp.

---

# 9. UE estimate channel H từ CSI-RS như thế nào?

Bắt đầu với SISO.

eNodeB phát reference symbol:

\[
X
\]

Channel:

\[
H
\]

UE nhận:

\[
Y=HX+N
\]

trong đó:

- \(X\): known CSI-RS.
- \(H\): complex channel coefficient.
- \(N\): noise/interference.
- \(Y\): received symbol.

Vì UE biết \(X\), ở mức đơn giản:

\[
\hat H\approx\frac{Y}{X}
\]

Ví dụ:

```text
X = known
Y = measured
```

UE có thể suy ra amplitude attenuation và phase rotation của channel.

Trong implementation thực tế, UE không chỉ chia trực tiếp.

Nó còn phải xử lý:

- noise filtering;
- pilot averaging;
- interpolation;
- multiple RX branches;
- frequency-selective fading;
- Doppler/time variation;
- interference.

Nhưng công thức:

\[
Y=HX+N
\]

là nền tảng trực giác.

---

# 10. MIMO channel matrix H

Khi nhiều TX ports và RX antennas tồn tại, \(H\) không còn là một số.

Giả sử:

```text
4 CSI-RS TX ports
2 RX antennas
```

Ta có:

\[
H=
\begin{bmatrix}
h_{00}&h_{01}&h_{02}&h_{03}\\
h_{10}&h_{11}&h_{12}&h_{13}
\end{bmatrix}
\]

Trong đó:

```text
h00 = channel từ TX port 0 đến RX antenna 0
h01 = channel từ TX port 1 đến RX antenna 0
...
h13 = channel từ TX port 3 đến RX antenna 1
```

Hình dung:

```text
                TX ports

             p0  p1  p2  p3
              ↓   ↓   ↓   ↓

RX0          h00 h01 h02 h03
RX1          h10 h11 h12 h13
```

Channel matrix chứa thông tin về:

- gain;
- phase;
- spatial correlation;
- khả năng hỗ trợ nhiều spatial streams.

---

# 11. RI — UE quyết định số spatial layers như thế nào?

## 11.1 RI là gì?

**RI = Rank Indicator.**

RI thể hiện rank/spatial layer recommendation của UE trong CSI framework.

Nếu:

```text
RI = 1
```

UE đang cho rằng transmission 1 layer phù hợp.

Nếu:

```text
RI = 2
```

UE đang cho rằng 2 spatial layers có thể mang lại performance tốt hơn trong giả định CSI tương ứng.

---

## 11.2 Không phải có 2 RX antennas thì RI luôn bằng 2

Ví dụ UE có:

```text
2 RX antennas
```

nhưng hai spatial paths có correlation rất cao:

```text
TX0 -------\
            \
             ---> UE
            /
TX1 -------/
```

Hai paths gần như mang cùng spatial information.

Khi đó channel matrix có thể gần rank 1.

UE có thể report:

```text
RI = 1
```

---

## 11.3 Khi nào Rank 2 có lợi?

Nếu hai spatial directions đủ độc lập:

```text
Layer 0 --------------> RX spatial dimension 0
Layer 1 --------------> RX spatial dimension 1
```

UE có thể tách được hai streams.

Khi đó Rank 2 có thể tăng throughput.

---

## 11.4 SVD để hiểu Rank

Một cách rất tốt để hiểu MIMO rank là Singular Value Decomposition:

\[
H=U\Sigma V^H
\]

với:

\[
\Sigma=
\begin{bmatrix}
\sigma_1&0\\
0&\sigma_2
\end{bmatrix}
\]

Nếu:

```text
σ1 = lớn
σ2 = rất nhỏ
```

thì:

```text
Spatial mode 1 █████████████
Spatial mode 2 █
```

Channel gần rank 1.

Nếu:

```text
σ1 = lớn
σ2 = cũng lớn
```

thì:

```text
Spatial mode 1 █████████████
Spatial mode 2 ███████████
```

hai spatial streams có thể hữu ích.

Lưu ý rất quan trọng:

> UE không bị 3GPP bắt buộc phải thực hiện một thuật toán đơn giản kiểu “SVD rồi đếm singular values”. Đây chỉ là mô hình giúp hiểu bản chất.

---

## 11.5 Rank được chọn dựa trên expected performance

Giả sử Rank 1:

```text
1 layer
SINR = 18 dB
```

Rank 2:

```text
Layer 0 SINR = 12 dB
Layer 1 SINR = 11 dB
```

Thoạt nhìn Rank 1 có SINR cao hơn.

Nhưng Rank 2 gửi 2 streams.

Một metric trực giác:

\[
R\approx\sum_{i=1}^{r}\log_2(1+\gamma_i)
\]

Rank 2 có thể có tổng rate lớn hơn Rank 1.

Do vậy UE có thể chọn Rank 2 dù SINR trên từng layer thấp hơn.

---

# 12. PMI — UE chọn precoder như thế nào?

## 12.1 PMI là gì?

**PMI = Precoding Matrix Indicator.**

UE không cần gửi toàn bộ channel matrix \(H\) lên eNodeB.

Thay vào đó LTE định nghĩa một tập codebook precoders.

Ví dụ khái niệm:

```text
PMI 0 → W0
PMI 1 → W1
PMI 2 → W2
PMI 3 → W3
...
```

UE và eNodeB đều biết các matrix tương ứng.

UE chỉ cần gửi index.

---

## 12.2 UE thử precoder

Giả sử Rank 2.

UE thử:

\[
W_0,\ W_1,\ W_2,\ W_3,\ldots
\]

Với mỗi precoder:

\[
G_i=HW_i
\]

Sau đó UE mô phỏng/ước lượng receiver performance.

Ví dụ:

| PMI | SINR layer 0 | SINR layer 1 |
|---:|---:|---:|
| 0 | 8 dB | 5 dB |
| 1 | 11 dB | 9 dB |
| 2 | 7 dB | 12 dB |
| 3 | 13 dB | 11 dB |

Nếu PMI 3 cho tổng expected throughput lớn nhất:

```text
PMI = 3
```

---

## 12.3 PMI không nhất thiết chỉ tối đa signal power

Nếu chỉ chọn precoder cho received power lớn nhất, có thể tạo ra spatial streams quá correlated.

Mục tiêu thực tế của MIMO spatial multiplexing là balance:

- signal strength;
- inter-layer interference;
- separability;
- expected SINR;
- achievable throughput.

Do vậy “PMI tốt nhất” phải được hiểu trong context của rank và receiver.

---

## 12.4 8-port CSI-RS và hai phần PMI

Với các codebook dành cho 8 CSI-RS antenna ports, CSI representation có thể liên quan tới hai codebook indices/PMI components.

Có thể hiểu trực giác:

```text
First PMI
   ↓
chọn một subspace/beam group tương đối rộng
   ↓
Second PMI
   ↓
refine lựa chọn precoder
```

Đây là cách giảm feedback overhead so với việc gửi trực tiếp một ma trận lớn.

Không nên hiểu first/second PMI chỉ đơn giản là “PMI cho antenna group 1 và group 2”; bản chất là hierarchical/codebook structure theo định nghĩa 3GPP.

---

# 13. CQI — UE suy ra chất lượng PDSCH như thế nào?

## 13.1 CQI là gì?

**CQI = Channel Quality Indicator.**

CQI phản ánh mức link quality mà UE cho rằng PDSCH có thể support dưới CSI assumptions tương ứng.

CQI không phải:

```text
RSRP
```

và cũng không phải:

```text
SINR trực tiếp
```

---

## 13.2 CQI không bằng SINR

Một hiểu nhầm phổ biến:

```text
SINR = 11 dB
→ CQI = 11
```

Điều này không đúng như một mapping phổ quát.

CQI phụ thuộc vào:

- Rank.
- PMI/precoder assumption.
- Frequency selectivity.
- Interference.
- Receiver implementation.
- Link-to-system mapping.
- Channel coding performance.
- Modulation.
- CSI reference resource assumptions.

---

## 13.3 UE phải dự đoán PDSCH decoding performance

Giả sử UE biết:

```text
H
Rank = 2
Precoder = W3
Noise/interference
```

Nó có thể estimate:

```text
post-processing SINR layer 0
post-processing SINR layer 1
```

Sau đó đánh giá mức transport format nào có thể decode với reliability phù hợp.

---

## 13.4 Frequency-selective SINR

Trong OFDM:

```text
Subcarrier →
8 dB | 11 dB | 5 dB | 14 dB | 9 dB | ...
```

UE không thể chỉ lấy một subcarrier.

Nó phải quy đổi tập SINR theo frequency thành một quality metric đại diện.

Khái niệm:

```text
per-RE SINR
     ↓
effective-SINR / link abstraction
     ↓
expected decoder performance
     ↓
CQI
```

Các chipset có thể sử dụng những algorithm nội bộ khác nhau.

---

## 13.5 CQI và BLER

Một cách hiểu rất quan trọng:

UE chọn CQI sao cho PDSCH transport-block error probability trên CSI reference resource đáp ứng tiêu chí khoảng 10% theo định nghĩa/spec assumptions.

Ví dụ minh họa:

```text
CQI 12
predicted BLER = 18%
→ quá cao

CQI 11
predicted BLER = 8%
→ acceptable
```

Khi đó UE report:

```text
CQI = 11
```

Đây chỉ là ví dụ.

---

# 14. Mối quan hệ thực sự giữa RI, PMI và CQI

Không nên hình dung quá cứng nhắc:

```text
Step 1: RI
Step 2: PMI
Step 3: CQI
```

như ba quá trình hoàn toàn độc lập.

Đúng hơn:

```text
For each candidate rank:
    for each allowed precoder:
        estimate effective channel
        estimate post-processing SINR
        estimate link performance

choose best rank / precoder hypothesis
derive CQI under selected CSI assumptions
```

Có thể minh họa:

```text
                H from CSI-RS
                     |
          +----------+----------+
          |                     |
       Rank 1                Rank 2
          |                     |
     W0 W1 W2...            W0 W1 W2...
          |                     |
      SINR/rate              SINR/rate
          |                     |
          +----------+----------+
                     |
                best option
                     |
            RI + PMI + CQI
```

Đây là cách hiểu sát bản chất hơn.

---

# 15. Ví dụ đầy đủ quá trình tính CSI

Giả sử:

```text
eNodeB:
4 CSI-RS ports

UE:
2 RX antennas
```

UE estimate:

\[
H_{2\times4}
\]

## Candidate Rank 1

UE thử codebook Rank 1:

```text
PMI 0 → 13 dB
PMI 1 → 15 dB
PMI 2 → 18 dB ← best
PMI 3 → 12 dB
```

Giả sử estimated throughput metric:

```text
4.1 units
```

Best Rank-1 hypothesis:

```text
RI candidate = 1
PMI candidate = 2
```

---

## Candidate Rank 2

```text
PMI 0 → 8 / 8 dB
PMI 1 → 11 / 9 dB
PMI 2 → 7 / 6 dB
PMI 3 → 12 / 11 dB ← best
```

Estimated total rate:

```text
5.3 units
```

Do:

```text
5.3 > 4.1
```

UE chọn:

```text
RI = 2
PMI = 3
```

Sau đó đánh giá CQI.

Ví dụ:

```text
CQI 12 → expected BLER 15%
CQI 11 → expected BLER 7%
```

Report:

```text
RI  = 2
PMI = 3
CQI = 11
```

Các giá trị SINR/throughput/BLER trong ví dụ này chỉ nhằm minh họa logic.

---

# 16. eNodeB làm gì sau khi nhận RI/PMI/CQI?

Một lỗi thường gặp là nghĩ eNodeB bắt buộc phải làm đúng mọi CSI recommendation.

Không phải.

CSI là input rất quan trọng, nhưng scheduler còn xét:

```text
RI / PMI / CQI
      +
HARQ state
      +
buffer occupancy
      +
UE QoS/priority
      +
PRB availability
      +
cell load
      +
interference coordination
      +
scheduler policy
```

Sau đó eNodeB mới quyết định actual PDSCH transmission.

Ví dụ:

```text
UE report:
RI = 2
```

nhưng scheduler vẫn có thể chọn Rank 1 trong một transmission cụ thể nếu cần.

---

# 17. Layer Mapping trước Precoding

Sau channel coding, scrambling và modulation, eNodeB có modulation symbols thuộc một hoặc hai codewords.

Các symbols được map vào spatial layers.

Ví dụ Rank 2:

```text
Codeword(s)
     ↓
Layer Mapping
     ↓
+----------+----------+
|                     |
Layer 0             Layer 1
 s0                  s1
```

Có thể viết vector:

\[
s=
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
\]

Layer là spatial stream logic.

Nó chưa phải physical antenna signal.

---

# 18. Precoding là gì?

Precoding biến layer-domain symbols thành transmit-domain signals.

Công thức quan trọng:

\[
\boxed{x=Ws}
\]

Trong đó:

- \(s\): vector spatial layers.
- \(W\): precoding matrix.
- \(x\): transmit vector sau precoding.

Precoding có thể phục vụ:

- beamforming;
- spatial multiplexing;
- phase alignment;
- amplitude weighting;
- spatial separation.

---

# 19. Ý nghĩa toán học của x = Ws

Giả sử Rank 2 và 4 transmit dimensions.

\[
s=
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
\]

\[
W=
\begin{bmatrix}
w_{00}&w_{01}\\
w_{10}&w_{11}\\
w_{20}&w_{21}\\
w_{30}&w_{31}
\end{bmatrix}
\]

Kết quả:

\[
x=
\begin{bmatrix}
x_0\\
x_1\\
x_2\\
x_3
\end{bmatrix}
=
W
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
\]

Từng transmit component:

\[
x_0=w_{00}s_0+w_{01}s_1
\]

\[
x_1=w_{10}s_0+w_{11}s_1
\]

\[
x_2=w_{20}s_0+w_{21}s_1
\]

\[
x_3=w_{30}s_0+w_{31}s_1
\]

Điều này cho thấy:

> Một layer không nhất thiết “đi ra một antenna”. Mỗi transmit dimension có thể chứa tổ hợp weighted của nhiều layers.

---

# 20. Từ physical channel H tới effective channel G = HW

Sau precoding:

\[
x=Ws
\]

Radio propagation:

\[
y=Hx+n
\]

Thay \(x\):

\[
y=HWs+n
\]

Đặt:

\[
\boxed{G=HW}
\]

ta có:

\[
\boxed{y=Gs+n}
\]

Đây là công thức cực kỳ quan trọng.

Có thể hiểu:

```text
H = propagation channel
W = precoding
G = channel mà spatial layers thực sự nhìn thấy
```

Hay:

```text
physical channel H
       +
precoder W
       ↓
effective channel G
```

---

# 21. Tại sao chỉ biết H từ CSI-RS chưa đủ để decode PDSCH?

CSI-RS measurement giúp UE có thông tin về channel phục vụ CSI.

Nhưng actual PDSCH đã được precoded.

PDSCH nhận được:

\[
y=HWs+n
\]

Receiver cần biết:

\[
HW
\]

để tách \(s\).

Nếu chỉ biết:

\[
H
\]

nhưng không biết actual effective transmission:

```text
H = known
W = not necessarily explicitly known at physical-array level
HW = ?
```

thì UE không thể đơn giản equalize đúng PDSCH.

Đây chính là lý do **DM-RS** rất quan trọng.

---

# 22. DM-RS là gì?

**DM-RS = Demodulation Reference Signal.**

Trong TM9, đây là **UE-specific reference signal** gắn với PDSCH transmission.

Nhiệm vụ:

> Cho UE estimate channel/effective channel của actual PDSCH antenna port để demodulate data.

Có thể nhớ:

```text
CSI-RS:
"Channel tốt thế nào, nên truyền ra sao?"

DM-RS:
"PDSCH vừa truyền tới tôi đã trải qua effective channel nào?"
```

---

# 23. DM-RS antenna ports trong TM9

UE-specific reference signal/PDSCH transmission có logical antenna ports trong nhóm:

```text
7 ... 14
```

Với Rank 2, về mặt trực giác có thể hình dung:

```text
Layer 0 → port 7
Layer 1 → port 8
```

Nhưng mapping thực tế phụ thuộc transmission scheme, DCI và specification.

Điểm quan trọng:

```text
CSI-RS ports: measurement domain
DM-RS ports: demodulation domain
```

Không nên nhầm nhóm 15–22 của 8-port CSI-RS với nhóm UE-specific DM-RS ports.

---

# 24. DM-RS giúp estimate effective channel như thế nào?

Giả sử một known DM-RS sequence:

\[
r
\]

Actual received reference:

\[
y_{DMRS}=Gr+n
\]

Vì UE biết \(r\), nó có thể estimate \(G\).

Trong SISO-like case:

\[
\hat g\approx\frac{y_{DMRS}}{r}
\]

Trong MIMO:

UE phải estimate nhiều channel coefficients tương ứng các DM-RS ports và RX branches.

Điểm cốt lõi:

\[
\boxed{\text{DM-RS} \rightarrow \hat G}
\]

sau đó:

\[
\boxed{\text{PDSCH} \rightarrow y=\hat Gs+n}
\]

và receiver tìm \(s\).

---

# 25. Rank-1: DM-RS và PDSCH

Giả sử chỉ 1 layer.

\[
s=s_0
\]

Effective channel:

\[
g
\]

PDSCH:

\[
y=gs+n
\]

DM-RS:

\[
y_r=gr+n
\]

UE estimate:

\[
\hat g
\]

Sau đó equalize:

\[
\hat s\approx\frac{y}{\hat g}
\]

Flow:

```text
DM-RS
   ↓
estimate ĝ
   |
   +-------------------+
                       |
PDSCH y ---------------+
                       ↓
                   Equalizer
                       ↓
                      ŝ
```

---

# 26. Rank-2: DM-RS và PDSCH

Giả sử:

```text
2 layers
2 RX antennas
```

Layer vector:

\[
s=
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
\]

Effective channel:

\[
G=
\begin{bmatrix}
g_{00}&g_{01}\\
g_{10}&g_{11}
\end{bmatrix}
\]

Received:

\[
\begin{bmatrix}
y_0\\
y_1
\end{bmatrix}
=
\begin{bmatrix}
g_{00}&g_{01}\\
g_{10}&g_{11}
\end{bmatrix}
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
+
\begin{bmatrix}
n_0\\
n_1
\end{bmatrix}
\]

Tức:

\[
y_0=g_{00}s_0+g_{01}s_1+n_0
\]

\[
y_1=g_{10}s_0+g_{11}s_1+n_1
\]

UE phải tìm hai unknown:

```text
s0
s1
```

từ hai received observations:

```text
y0
y1
```

và channel estimate \(G\).

---

# 27. DM-RS multiplexing và channel interpolation

## 27.1 Nhiều DM-RS ports phải phân biệt được nhau

LTE sử dụng resource mapping và orthogonal structures để UE phân biệt reference signals của các ports.

Không nên hình dung hai DM-RS đơn giản “đè lên nhau không phân biệt”.

UE biết:

- vị trí RE;
- reference sequence;
- orthogonal cover/code structure;
- port configuration.

---

## 27.2 DM-RS không nằm trên mọi data RE

Ví dụ khái niệm:

```text
P P D D P P
P P D D P P
P P P P P P
P P D D P P
```

`D` = DM-RS RE  
`P` = PDSCH data RE

UE estimate \(G\) tại DM-RS positions.

Sau đó interpolate để suy ra channel tại neighboring PDSCH RE.

---

## 27.3 Time/frequency interpolation

Channel có thể thay đổi theo:

- subcarrier;
- OFDM symbol.

Do đó về đầy đủ hơn:

\[
G=G(k,l)
\]

với:

- \(k\): subcarrier index.
- \(l\): OFDM symbol index.

UE estimate:

\[
\hat G(k,l)
\]

tại pilot positions rồi nội suy cho data positions.

---

# 28. PDSCH Receiver Chain

Sau khi tín hiệu đến UE:

```text
Antenna
   ↓
RF front-end
   ↓
ADC
   ↓
CP removal
   ↓
FFT
   ↓
Resource Grid
```

Sau FFT, UE đã có complex symbols theo từng subcarrier/OFDM symbol.

Tiếp theo:

```text
Resource Grid
      |
 +----+----+
 |         |
DM-RS     PDSCH
 |         |
 v         |
Channel    |
Estimation |
 |         |
 +----+----+
      |
      v
MIMO Equalization
      |
      v
Layer Symbols
      |
      v
Soft Demodulation
      |
      v
LLR
```

---

# 29. MIMO Equalization

Mục tiêu:

Từ:

\[
y=Gs+n
\]

ước lượng:

\[
s
\]

Nếu \(G\) là matrix, mỗi receive branch là tổ hợp của nhiều layers.

Receiver cần “unmix” các layers.

Các phương pháp phổ biến về mặt lý thuyết:

- Zero-Forcing.
- MMSE.
- SIC/MMSE-SIC.
- ML-like detection.

Trong tài liệu này tập trung vào MMSE vì dễ hiểu và rất phổ biến để minh họa LTE MIMO receiver.

---

# 30. Zero-Forcing và hạn chế

Nếu bỏ qua noise:

\[
y=Gs
\]

Nếu \(G\) square và khả nghịch:

\[
s=G^{-1}y
\]

Đó là ý tưởng Zero-Forcing.

Nó cố triệt inter-layer mixing.

Nhưng nếu \(G\) gần singular:

```text
one strong spatial mode
one very weak mode
```

\(G^{-1}\) có thể chứa coefficient rất lớn.

Noise cũng bị khuếch đại.

Đó gọi là:

**noise enhancement**.

---

# 31. MMSE Equalizer

MMSE cân bằng hai mục tiêu:

```text
reduce interference
+
avoid excessive noise amplification
```

Một dạng:

\[
\boxed{
F=
(G^HG+\sigma_n^2I)^{-1}G^H
}
\]

Sau đó:

\[
\boxed{\hat s=Fy}
\]

Trong đó:

- \(G^H\): Hermitian transpose.
- \(\sigma_n^2\): noise variance.
- \(I\): identity matrix.

Khi noise rất nhỏ, MMSE tiến gần Zero-Forcing.

Khi noise lớn, regularization term:

\[
\sigma_n^2I
\]

giúp tránh inversion quá aggressive.

---

# 32. Ví dụ số Rank-2 với MMSE

Giả sử:

\[
G=
\begin{bmatrix}
0.9&0.2\\
0.1&0.8
\end{bmatrix}
\]

PDSCH layers:

\[
s=
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
\]

UE nhận:

\[
y_0=0.9s_0+0.2s_1+n_0
\]

\[
y_1=0.1s_0+0.8s_1+n_1
\]

Ta thấy:

- \(y_0\) chủ yếu chứa \(s_0\) nhưng vẫn bị \(s_1\) leak vào.
- \(y_1\) chủ yếu chứa \(s_1\) nhưng vẫn bị \(s_0\) leak vào.

Nếu chỉ lấy:

```text
s0 ≈ y0 / 0.9
```

thì phần:

```text
0.2 s1
```

trở thành interference.

MMSE sử dụng cả:

```text
y0
y1
```

và toàn bộ matrix \(G\) để ước lượng đồng thời hai layers.

Flow:

```text
        y0 --------\
                    \
                     MMSE ----> ŝ0
                    /
        y1 --------/        \-> ŝ1
```

---

# 33. Sau Equalizer: Layer De-mapping

Equalizer trả về layer-domain symbols.

Ví dụ:

```text
ŝ0
ŝ1
```

Nhưng transmitter trước đó có thể đã map một hoặc hai codewords lên các layers.

Receiver phải đảo quá trình đó:

```text
Layer 0
Layer 1
   ↓
Layer de-mapping
   ↓
Codeword-domain soft symbols
```

LTE chỉ có tối đa 2 codewords, kể cả khi spatial rank lớn hơn 2.

Do đó:

```text
Rank 4
```

không có nghĩa:

```text
4 codewords
```

---

# 34. Soft Demodulation và LLR

Sau equalization, UE có complex constellation symbols.

Ví dụ QPSK:

```text
       Q
       ↑

   •       •

-------+--------→ I

   •       •
```

Một received symbol có thể nằm gần một constellation point.

Hard decision sẽ nói:

```text
bits = 00
```

nhưng Turbo decoder hoạt động tốt hơn với soft information.

---

## 34.1 LLR

**LLR = Log-Likelihood Ratio.**

Trực giác:

```text
LLR rất lớn dương
→ rất tin một bit value

LLR gần 0
→ không chắc

LLR rất lớn âm
→ rất tin bit value còn lại
```

Ví dụ:

```text
LLR = +9.2
```

confidence rất cao.

```text
LLR = +0.15
```

confidence thấp.

---

## 34.2 LLR tận dụng noise estimate

Soft demapper không chỉ nhìn Euclidean distance tới constellation point.

Nó còn sử dụng noise/interference variance.

Cùng một khoảng cách trên constellation:

- nếu noise rất nhỏ → confidence cao;
- nếu noise lớn → confidence thấp.

Điều này giải thích tại sao channel estimation và noise estimation đều ảnh hưởng decoder performance.

---

# 35. Descrambling

Transmitter có:

```text
coded bits
   ↓
scrambling
   ↓
modulation
```

Receiver đảo:

```text
soft demodulation
   ↓
LLR
   ↓
descrambling
```

Ở soft domain, descrambling tương ứng điều chỉnh dấu/order của LLR theo scrambling sequence.

Mục tiêu là đưa soft bits trở về coded-bit domain trước rate recovery.

---

# 36. Rate De-matching

Turbo encoder tạo 3 output streams logic:

```text
Systematic
Parity 1
Parity 2
```

Rate matching gồm:

- sub-block interleaving;
- collection vào circular buffer;
- bit selection;
- pruning/puncturing/repetition tùy cần.

Mục đích:

> Số coded bits sau Turbo encoder thường không bằng đúng số modulation bits mà PDSCH có thể mang.

Rate matching phải chọn đúng số bits cần transmit.

---

## 36.1 Receiver làm ngược

Received LLR:

```text
LLR sequence
    ↓
Rate de-matching
    ↓
restore circular-buffer positions
    ↓
Systematic LLR
Parity-1 LLR
Parity-2 LLR
```

Những vị trí không được transmit có reliability tương ứng “unknown”/neutral.

Những vị trí được repetition có thể được combine.

---

# 37. HARQ Soft Combining

LTE downlink dùng HARQ.

Giả sử lần đầu:

```text
RV = 0
```

UE nhận PDSCH và decode.

Nếu TB CRC fail:

```text
NACK
```

eNodeB retransmit, có thể với redundancy version khác:

```text
RV = 2
```

UE không bỏ LLR lần trước.

Thay vào đó:

```text
Previous soft information
          +
New soft information
          ↓
      HARQ combining
          ↓
Strong decoder input
```

---

## 37.1 Incremental Redundancy trực giác

Turbo code có nhiều coded bits.

Transmission đầu không nhất thiết gửi tất cả.

RV khác có thể chọn vùng khác của circular buffer.

Ví dụ khái niệm:

```text
Mother code:
[S S S P1 P1 P1 P2 P2 P2 ...]

RV0:
some systematic + parity

RV2:
different parity portion
```

Khi combine:

```text
UE có nhiều thông tin hơn
```

không chỉ đơn giản là “nhận lại cùng packet mạnh hơn”.

---

# 38. Turbo Decoding

Sau rate recovery/HARQ combine:

```text
Systematic LLR
Parity-1 LLR
Parity-2 LLR
```

được đưa vào Turbo decoder.

LTE Turbo code sử dụng hai constituent convolutional encoders và một interleaver.

Decoder thường có hai constituent decoders trao đổi extrinsic information:

```text
Decoder 1
   ↓
extrinsic information
   ↓
interleaver
   ↓
Decoder 2
   ↓
extrinsic information
   ↓
deinterleaver
   ↓
Decoder 1
...
```

Mỗi iteration cải thiện belief về information bits.

---

# 39. CRC, ACK và NACK

TX flow:

```text
Transport Block
      ↓
TB CRC
      ↓
segmentation nếu cần
      ↓
CB CRC
      ↓
Turbo coding
```

RX sau Turbo decoding:

```text
Decoded Code Blocks
      ↓
CB CRC check
      ↓
CB concatenation
      ↓
Transport Block
      ↓
TB CRC check
```

Nếu TB CRC pass:

```text
ACK
```

Nếu fail:

```text
NACK
```

HARQ process sử dụng ACK/NACK để quyết định retransmission.

---

# 40. CSI-RS vs CRS vs DM-RS

| Đặc điểm | CRS | CSI-RS | UE-specific DM-RS |
|---|---|---|---|
| Tên đầy đủ | Cell-specific Reference Signal | Channel State Information Reference Signal | Demodulation Reference Signal |
| Scope | Cell-specific | CSI measurement resource | UE/PDSCH specific |
| Mục tiêu chính | legacy reference/channel functions | đo channel để derive CSI | estimate channel để demodulate PDSCH |
| RI/PMI/CQI | dùng trong legacy CSI contexts | rất quan trọng với TM9 | không phải mục đích chính |
| PDSCH demodulation TM9 | không phải reference chính | không | có |
| Rel-10 ports tiêu biểu | CRS ports legacy | 15–22 cho 8-port case | nhóm 7–14 |
| Mật độ | tương đối dày | sparse | gắn với actual transmission |

Một cách nhớ:

```text
CRS:
"reference chung của cell theo kiến trúc legacy"

CSI-RS:
"đo môi trường để quyết định transmission"

DM-RS:
"đo effective channel của transmission thực tế"
```

---

# 41. Ví dụ End-to-End TM9 Rank-2

Bây giờ nối toàn bộ kiến thức vào một scenario.

## 41.1 Cấu hình

Giả sử:

```text
eNodeB:
4 CSI-RS ports

UE:
2 RX antennas

Transmission Mode:
TM9
```

---

## 41.2 CSI-RS transmission

eNodeB phát CSI-RS.

UE nhận qua 2 RX antennas.

UE estimate:

\[
H=
\begin{bmatrix}
h_{00}&h_{01}&h_{02}&h_{03}\\
h_{10}&h_{11}&h_{12}&h_{13}
\end{bmatrix}
\]

---

## 41.3 CSI calculation

UE thử Rank 1:

```text
W0 → rate 3.5
W1 → rate 3.9
W2 → rate 4.1 ← best
```

UE thử Rank 2:

```text
W0 → rate 4.2
W1 → rate 4.8
W2 → rate 4.1
W3 → rate 5.3 ← best
```

Kết luận:

```text
RI = 2
PMI = 3
```

Tiếp tục derive CQI.

Giả sử:

```text
CQI 12 → BLER estimate > target
CQI 11 → BLER estimate acceptable
```

UE report:

```text
RI  = 2
PMI = 3
CQI = 11
```

---

## 41.4 Scheduler

eNodeB nhận CSI.

Scheduler quyết định:

```text
Rank = 2
Precoder = W3
MCS = selected based on CQI + scheduler logic
PRB allocation = selected
```

---

## 41.5 Coding chain

Transport Block:

```text
TB
 ↓
TB CRC
 ↓
Code Block segmentation
 ↓
CB CRC
 ↓
Turbo Encoder
 ↓
Rate Matching
 ↓
Codeword(s)
 ↓
Scrambling
 ↓
Modulation
```

Giả sử 64QAM hoặc một modulation phù hợp MCS.

---

## 41.6 Layer Mapping

Modulation symbols:

```text
Codeword(s)
   ↓
Layer mapping
   ↓
Layer 0
Layer 1
```

Vector:

\[
s=
\begin{bmatrix}
s_0\\
s_1
\end{bmatrix}
\]

---

## 41.7 Precoding

\[
x=W_3s
\]

---

## 41.8 Radio channel

\[
y=Hx+n
\]

nên:

\[
y=HW_3s+n
\]

Đặt:

\[
G=HW_3
\]

ta có:

\[
y=Gs+n
\]

---

## 41.9 DM-RS

PDSCH đi kèm UE-specific DM-RS trên antenna ports thích hợp.

UE sử dụng DM-RS để estimate:

\[
\hat G
\]

không cần reconstruct riêng toàn bộ physical-array beamforming implementation.

---

## 41.10 FFT và Resource Extraction

UE:

```text
RF
 ↓
ADC
 ↓
CP removal
 ↓
FFT
 ↓
Resource grid
 ↓
extract DM-RS + PDSCH RE
```

---

## 41.11 Channel estimation

DM-RS:

```text
known reference
      +
received pilot
      ↓
Ĝ at pilot positions
      ↓
interpolation
      ↓
Ĝ for PDSCH RE
```

---

## 41.12 MIMO equalization

Received:

\[
y=Gs+n
\]

MMSE:

\[
F=(\hat G^H\hat G+\sigma_n^2I)^{-1}\hat G^H
\]

\[
\hat s=Fy
\]

Output:

```text
ŝ0
ŝ1
```

---

## 41.13 Soft Demodulation

```text
ŝ0 / ŝ1
   ↓
Constellation demapper
   ↓
LLRs
```

---

## 41.14 Layer de-map và descramble

```text
Layer LLRs
   ↓
Layer de-mapping
   ↓
Codeword LLR
   ↓
Descrambling
```

---

## 41.15 Rate recovery

```text
Descrambled LLR
      ↓
Rate de-matching
      ↓
Circular buffer reconstruction
      ↓
Systematic / Parity streams
```

---

## 41.16 HARQ combining

Nếu đây là retransmission:

```text
Current LLR
   +
Stored HARQ LLR
   ↓
Combined soft buffer
```

---

## 41.17 Turbo decode

```text
Combined soft bits
      ↓
Turbo Decoder
      ↓
decoded CBs
```

---

## 41.18 CRC

```text
CB CRC
 ↓
CB concatenation
 ↓
TB CRC
```

Nếu pass:

```text
ACK
```

Nếu fail:

```text
NACK
```

---

# 42. Các điểm dễ nhầm

## 42.1 “TM9 = 8 antennas” là chưa đủ

TM9 có khả năng hỗ trợ nhiều ports/layers nhưng actual transmission không nhất thiết dùng 8 layers.

Ví dụ:

```text
8 CSI-RS ports
   ↓
RI = 2
   ↓
2-layer PDSCH
```

Hoàn toàn hợp lý.

---

## 42.2 CSI-RS ports không bằng PDSCH DM-RS ports

```text
CSI-RS 8-port:
15 ... 22

UE-specific DM-RS:
group 7 ... 14
```

Chức năng khác nhau.

---

## 42.3 Port không phải physical antenna

Một logical port có thể được thực hiện bởi nhiều physical antenna elements.

---

## 42.4 CSI-RS không trực tiếp decode PDSCH

CSI-RS:

```text
measurement
```

DM-RS:

```text
demodulation
```

---

## 42.5 CQI không phải SINR

CQI là link-quality indication theo CSI assumptions, không phải phép đổi tên của SINR.

---

## 42.6 RI không bằng “số antenna tối đa”

RI là recommended spatial rank dựa trên channel/performance.

---

## 42.7 PMI không phải exact physical beam weight

PMI liên quan codebook precoder assumption/selection.

Physical-array implementation dưới logical antenna-port abstraction có thể khác.

---

## 42.8 DM-RS “được precoded giống PDSCH” cần hiểu ở logical antenna-port level

Cách nói trực giác:

```text
DM-RS và PDSCH trải qua cùng effective transmission channel
```

là rất hữu ích.

Nhưng khi đọc 3GPP, nên suy nghĩ theo logical antenna ports thay vì cố gán trực tiếp:

```text
DM-RS sequence
→ explicit physical matrix W
→ physical antenna 0...N
```

cho mọi vendor implementation.

---

## 42.9 \(H\) từ CSI-RS và \(G\) từ DM-RS không phải hai measurement có mục đích giống nhau

```text
H-like CSI measurement
   ↓
transmission selection

G-like effective PDSCH channel
   ↓
actual demodulation
```

---

# 43. Các công thức quan trọng

## 43.1 Reference-signal channel estimation

\[
Y=HX+N
\]

Trực giác:

\[
\hat H\approx Y/X
\]

---

## 43.2 MIMO channel

\[
y=Hx+n
\]

---

## 43.3 Precoding

\[
\boxed{x=Ws}
\]

---

## 43.4 Precoded MIMO channel

\[
\boxed{y=HWs+n}
\]

---

## 43.5 Effective channel

\[
\boxed{G=HW}
\]

---

## 43.6 Receiver model

\[
\boxed{y=Gs+n}
\]

---

## 43.7 MMSE

\[
\boxed{
F=(G^HG+\sigma_n^2I)^{-1}G^H
}
\]

---

## 43.8 Equalized layers

\[
\boxed{\hat s=Fy}
\]

---

## 43.9 Spatial-rate intuition

\[
\boxed{
R\approx\sum_{i=1}^{r}\log_2(1+\gamma_i)
}
\]

Đây là công thức trực giác, không phải exact algorithm bắt buộc cho UE CSI implementation.

---

# 44. Sơ đồ tổng kết toàn bộ TM9

```text
┌──────────────────────────────────────────────────────────────┐
│                       CSI MEASUREMENT                        │
└──────────────────────────────────────────────────────────────┘

                         eNodeB
                            |
                         CSI-RS
                            |
                            v
                           UE
                            |
                   Estimate channel H
                            |
                  +---------+---------+
                  |         |         |
                  v         v         v
                 RI        PMI       CQI
                  |         |         |
                  +---------+---------+
                            |
                            v
                         eNodeB


┌──────────────────────────────────────────────────────────────┐
│                    TRANSMISSION DECISION                     │
└──────────────────────────────────────────────────────────────┘

                           CSI
                            |
                            v
                       Scheduler
                            |
          +-----------------+-----------------+
          |                 |                 |
          v                 v                 v
        Rank             Precoder W          MCS
          |                 |                 |
          +-----------------+-----------------+
                            |
                            v
                       PDSCH TX chain


┌──────────────────────────────────────────────────────────────┐
│                        PDSCH TX                              │
└──────────────────────────────────────────────────────────────┘

                    Transport Block
                           |
                         TB CRC
                           |
                    CB segmentation
                           |
                         CB CRC
                           |
                     Turbo Encoder
                           |
                     Rate Matching
                           |
                       Scrambling
                           |
                       Modulation
                           |
                      Layer Mapping
                           |
                           v
                          s
                           |
                           v
                     Precoding W

                        x = Ws
                           |
                           v
                    Radio Channel H

                     y = HWs + n


┌──────────────────────────────────────────────────────────────┐
│                       PDSCH RX                               │
└──────────────────────────────────────────────────────────────┘

                     Received waveform
                           |
                           v
                     RF / ADC / FFT
                           |
                           v
                     Resource Grid
                           |
                +----------+----------+
                |                     |
                v                     v
              DM-RS                 PDSCH
                |                     |
                v                     |
         Estimate effective           |
          channel G = HW              |
                |                     |
                +----------+----------+
                           |
                           v
                     MIMO Equalizer
                           |
                           v
                         ŝ layers
                           |
                           v
                     Layer de-map
                           |
                           v
                    Soft Demodulation
                           |
                           v
                          LLR
                           |
                           v
                     Descrambling
                           |
                           v
                    Rate de-matching
                           |
                           v
                     HARQ combining
                           |
                           v
                      Turbo Decoder
                           |
                           v
                        CB CRC
                           |
                           v
                   CB concatenation
                           |
                           v
                        TB CRC
                      /        \
                   PASS        FAIL
                    |            |
                    v            v
                   ACK          NACK
```

---

# 45. Tài liệu 3GPP nên đọc

Để đi sâu hơn, nên đọc theo thứ tự sau.

## 45.1 3GPP TS 36.211 — Physical Channels and Modulation

Dùng để hiểu:

- Resource Grid.
- PDSCH mapping.
- Layer mapping.
- Precoding.
- CRS.
- UE-specific reference signals.
- CSI-RS.
- Antenna ports.
- CSI-RS resource/subframe configuration.

Các phần rất quan trọng:

```text
6.3    Physical Downlink Shared Channel
6.3.3  Layer mapping
6.3.4  Precoding
6.10   Reference signals
6.10.3 UE-specific reference signals
6.10.5 CSI reference signals
```

---

## 45.2 3GPP TS 36.212 — Multiplexing and Channel Coding

Dùng để hiểu:

- TB CRC.
- Code Block Segmentation.
- CB CRC.
- Turbo encoder.
- Rate matching.
- Circular buffer.
- DCI encoding.
- DCI Format 2C.

---

## 45.3 3GPP TS 36.213 — Physical Layer Procedures

Dùng để hiểu:

- Transmission modes.
- TM9.
- PDSCH reception assumptions.
- CQI/PMI/RI.
- CSI reporting modes.
- Link adaptation.
- HARQ procedures.
- DCI/PDSCH transmission scheme relationship.

---

## 45.4 3GPP TS 36.331 — RRC

Dùng để hiểu cách eNodeB cấu hình UE:

```text
transmissionMode
CSI-RS-Config-r10
antennaPortsCount-r10
resourceConfig-r10
subframeConfig-r10
p-C-r10
zeroTxPowerCSI-RS
CQI reporting configuration
```

---

# Phụ lục A — Cách nhớ TM9 bằng câu hỏi

## CSI-RS

```text
UE hỏi:
"Downlink spatial channel hiện tại trông như thế nào?"
```

---

## RI

```text
"Nên truyền bao nhiêu spatial layers?"
```

---

## PMI

```text
"Nên dùng precoder nào trong codebook?"
```

---

## CQI

```text
"Với channel/rank/precoder này, PDSCH có thể chạy mạnh đến đâu?"
```

---

## Precoding

```text
"Biến các layers thành spatial transmission như thế nào?"
```

---

## DM-RS

```text
"Actual PDSCH đã trải qua effective channel nào?"
```

---

## MMSE

```text
"Làm sao tách các layers bị trộn trong y?"
```

---

## LLR

```text
"Mỗi coded bit đáng tin đến mức nào?"
```

---

## HARQ

```text
"Nếu decode fail, làm sao tận dụng soft information cũ với retransmission?"
```

---

## Turbo decoder

```text
"Làm sao dùng systematic + parity soft bits để khôi phục information bits?"
```

---

# Phụ lục B — Một chuỗi công thức duy nhất

Bắt đầu từ CSI:

\[
\text{CSI-RS}\rightarrow\hat H
\]

UE đánh giá precoder:

\[
G_i=\hat H W_i
\]

UE chọn:

\[
RI,\ PMI,\ CQI
\]

eNodeB precodes PDSCH:

\[
x=Ws
\]

Qua channel:

\[
y=Hx+n
\]

Thay \(x\):

\[
y=HWs+n
\]

Đặt:

\[
G=HW
\]

DM-RS giúp UE estimate:

\[
\hat G
\]

MMSE:

\[
F=(\hat G^H\hat G+\sigma_n^2I)^{-1}\hat G^H
\]

Recover layers:

\[
\hat s=Fy
\]

Sau đó:

\[
\hat s
\rightarrow
LLR
\rightarrow
Rate\ Recovery
\rightarrow
HARQ\ Combine
\rightarrow
Turbo\ Decode
\rightarrow
TB
\]

Đây chính là toàn bộ mạch logic từ **CSI measurement đến user data recovery** trong TM9.

---

# Phụ lục C — Những câu hỏi tự kiểm tra

Sau khi học xong tài liệu, bạn nên tự trả lời được:

1. Tại sao TM9 cần CSI-RS trong khi LTE đã có CRS?
2. CSI-RS và DM-RS khác nhau ở mục đích nào?
3. Antenna port có phải physical antenna không?
4. Tại sao 8 CSI-RS ports không có nghĩa PDSCH luôn truyền 8 layers?
5. UE estimate \(H\) từ CSI-RS theo nguyên lý nào?
6. RI phụ thuộc vào những yếu tố gì?
7. Tại sao Rank 2 có thể tốt hơn Rank 1 dù SINR mỗi layer thấp hơn?
8. PMI đại diện cho gì?
9. Tại sao UE không gửi toàn bộ \(H\) lên eNodeB?
10. CQI có phải một phép ánh xạ cố định từ SINR không?
11. Precoding equation \(x=Ws\) có ý nghĩa vật lý gì?
12. Tại sao PDSCH receiver cần \(G=HW\) thay vì chỉ \(H\)?
13. DM-RS cho UE biết gì?
14. Với Rank 2, tại sao \(y_0\) chứa cả \(s_0\) và \(s_1\)?
15. MMSE khác Zero-Forcing ở điểm quan trọng nào?
16. Tại sao receiver tạo LLR thay vì hard bits?
17. Rate de-matching đảo quá trình nào ở transmitter?
18. HARQ soft combining diễn ra trước hay sau Turbo decoding?
19. TB CRC quyết định ACK/NACK như thế nào?
20. DCI 2C liên hệ với TM9 ra sao?

Nếu trả lời được toàn bộ 20 câu này, bạn đã nắm được phần lớn flow PHY quan trọng của TM9 từ CSI measurement tới PDSCH decode.

---

# Phụ lục D — Ghi chú về mức độ trừu tượng

Một số công thức trong tài liệu, đặc biệt:

\[
G=HW
\]

được sử dụng như mô hình MIMO rất hữu ích để hiểu.

Trong implementation thực tế:

- logical antenna port là abstraction của 3GPP;
- physical antenna array có thể lớn hơn số logical ports;
- beamforming có thể được thực hiện dưới antenna-port abstraction;
- CSI calculation algorithm cụ thể là vendor/chipset implementation;
- MMSE form thực tế có thể include interference covariance thay vì chỉ \(\sigma_n^2I\);
- channel estimation có thể phức tạp hơn LS division + interpolation;
- LLR calculation phụ thuộc receiver architecture.

Do đó tài liệu này nên được hiểu theo hai lớp:

```text
3GPP-defined behavior / signalling
            +
MIMO receiver mathematical model
```

Hai lớp kết hợp giúp hiểu hệ thống nhưng không nên đồng nhất mọi biến toán học với một block hardware duy nhất trong mọi commercial implementation.

---

# Kết luận

TM9 không chỉ là “một transmission mode hỗ trợ nhiều antennas”.

Bản chất quan trọng nhất là kiến trúc:

```text
CSI-RS
   ↓
Measure spatial channel
   ↓
RI / PMI / CQI
   ↓
Select Rank / Precoder / MCS
   ↓
Precoded PDSCH
   ↓
DM-RS
   ↓
Estimate effective PDSCH channel
   ↓
MIMO Equalization
   ↓
Soft bits
   ↓
HARQ + Turbo decode
```

Nếu chỉ nhớ một chuỗi công thức, hãy nhớ:

\[
\boxed{
\text{CSI-RS}
\rightarrow H
\rightarrow RI/PMI/CQI
\rightarrow W
\rightarrow y=HWs+n
\rightarrow \text{DM-RS}
\rightarrow \widehat{HW}
\rightarrow \hat s
\rightarrow LLR
\rightarrow \text{Turbo Decode}
}
\]

Đây là “xương sống” để tiếp tục học sâu hơn các chủ đề như:

- LTE codebook chi tiết;
- 8TX precoding;
- CSI reporting modes;
- DCI Format 2C;
- UE-specific RS mapping;
- MMSE-IRC receiver;
- MU-MIMO;
- CoMP;
- TM10;
- và sự chuyển tiếp từ LTE CSI-RS/DM-RS sang NR CSI-RS/PDSCH DM-RS.
