---
title: Present English
author: rainer
date: '2026-01-01T01:26:00+03:00'
categories:
- English
tags:
- English
math: true
mermaid: true
render_with_liquid: false
image: https://rainer24898.github.io/blog/assets/img/post/speaking_english/ccv.png

---


<audio controls>
  <source src="https://rainer24898.github.io/blog/assets/audio/post/present/1.wav" type="audio/mpeg">
</audio>

Today, I will present an overview of Layer 1 in LTE, also known as the Physical Layer.

When we use LTE to browse the internet, watch videos, or send messages, all of that data must eventually be converted into radio signals and transmitted over the air. This conversion process is handled by the Physical Layer.

In this seminar, I will focus on the key ideas behind LTE Layer 1: how LTE organizes radio resources, how data is transmitted in downlink and uplink, what the main physical channels are, and how techniques such as modulation, coding, HARQ, reference signals

Before going into the details of the Physical Layer, let’s first look at where it is located in the LTE protocol stack.

At the upper layers, we have RRC layer. Below that, LTE uses several protocol layers such as PDCP, RLC, and MAC. At the bottom of the stack, we have the Physical Layer, or Layer 1.

The Physical Layer directly communicates with the radio channel. It receives data from the MAC layer and converts that data into radio signals. In the opposite direction, it receives radio signals from the antenna and converts them back into bits for upper layers.

A simple way to understand this is: MAC decides who gets radio resources and when, while the Physical Layer actually transmits the data over the air.

So, the Physical Layer is not only responsible for sending signals. It also plays a key role in performance, reliability, latency, and spectral efficiency.

Now that we know where Layer 1 is located, let’s look at its main responsibilities.

The LTE Physical Layer has several important responsibilities.

First, it prepares data for transmission. A transport block from the MAC layer is processed with CRC, channel coding, rate matching, scrambling, and modulation.

Second, it maps the modulated symbols onto LTE radio resources. These resources are arranged in a time-frequency structure called the resource grid.

Third, the Physical Layer supports different access technologies. In LTE, the downlink uses OFDMA, while the uplink uses SC-FDMA.

Fourth, it supports reliability and performance techniques such as HARQ, link adaptation, reference signals, and MIMO.

In short, Layer 1 is responsible for turning digital bits into radio waveforms and making sure that those waveforms can be transmitted efficiently and decoded correctly at the receiver.

The key point is: Layer 1 is where digital communication becomes real radio transmission.

To understand how LTE transmits data, we need to understand how LTE divides time and frequency resources. That leads us to the LTE resource grid.

This is one of the most important concepts in LTE Physical Layer: the resource grid.

LTE organizes radio resources in two dimensions: time and frequency.

In the time domain, one LTE radio frame has a duration of 10 milliseconds. Each frame is divided into 10 subframes, and each subframe lasts 1 millisecond. Each subframe contains 2 slots, and each slot lasts 0.5 milliseconds. With normal cyclic prefix, each slot contains 7 OFDM symbols.

In the frequency domain, LTE divides the bandwidth into many small subcarriers. The spacing between subcarriers is 15 kHz. A group of 12 subcarriers forms one Resource Block, and one Resource Block has a bandwidth of 180 kHz.

The smallest unit in this grid is called a Resource Element. A Resource Element corresponds to one subcarrier during one OFDM symbol.

The scheduler at the MAC layer decides which Resource Blocks are assigned to which UE, while the Physical Layer maps the actual data onto those Resource Blocks.

The key message here is: all LTE physical transmission happens on this time-frequency grid.

After understanding the resource grid, the next question is: how does LTE allow multiple users to share these resources? This is where OFDMA and SC-FDMA come in.

LTE uses two different multiple access techniques for downlink and uplink.

For the downlink, from the eNodeB to the UE, LTE uses OFDMA, which stands for Orthogonal Frequency Division Multiple Access.

OFDMA allows the base station to assign different groups of subcarriers to different users at the same time. This gives LTE high flexibility and high throughput in the downlink.

For the uplink, from the UE to the eNodeB, LTE uses SC-FDMA, which stands for Single Carrier Frequency Division Multiple Access.

The reason is mainly related to power efficiency. A mobile phone has limited battery capacity. If LTE used OFDMA in the uplink, the signal would have a high PAPR (Peak-to-Average Power Ratio,). High PAPR makes the power amplifier in the phone less efficient and consumes more battery.

SC-FDMA has a lower PAPR, which helps the UE transmit more efficiently and save battery power.

So, LTE uses OFDMA in the downlink for flexibility and high throughput, and SC-FDMA in the uplink for power efficiency.

Now that we know how resources are shared, let’s look at the physical channels that carry data, control information, broadcast information, and random access signals.

LTE defines several physical channels. These channels can be grouped into three main categories: data channels, control channels, and broadcast or access channels.

First, we have the data channels.

The PDSCH, or Physical Downlink Shared Channel, carries downlink user data from the eNodeB to the UE. For example, when a user downloads a file or watches a video, the data is mainly transmitted through PDSCH.

The PUSCH, or Physical Uplink Shared Channel, carries uplink user data from the UE to the eNodeB. For example, when the UE uploads data or sends application traffic, it uses PUSCH.

Second, we have control channels.

The PDCCH, or Physical Downlink Control Channel, carries downlink control information, also called DCI. DCI tells the UE which Resource Blocks are assigned, which modulation and coding scheme is used, and which HARQ process is involved.

The PUCCH, or Physical Uplink Control Channel, carries uplink control information such as ACK/NACK, CQI, PMI, and RI.

The PCFICH tells the UE how many OFDM symbols in a subframe are used for the control region.

The PHICH carries HARQ ACK/NACK feedback for uplink transmission.

Third, we have broadcast and random access channels.

The PBCH, or Physical Broadcast Channel, carries the Master Information Block, or MIB. This gives the UE basic information about the cell.

The PRACH, or Physical Random Access Channel, is used when a UE wants to access the network, especially during initial access.

A useful way to remember this is: PDSCH and PUSCH carry user data, PDCCH and PUCCH carry control information, PBCH carries basic system information, and PRACH is used for initial access.

After looking at the channels, let’s discuss how LTE protects and modulates the data before sending it over the air.

The Physical Layer does not transmit raw bits directly. Before transmission, the data goes through several processing steps.

First, LTE adds a CRC, which is used for error detection. Then, the data is encoded using channel coding. For LTE data channels, turbo coding is commonly used. After that, rate matching adjusts the number of coded bits so that they fit into the available radio resources.

Next, the bits are scrambled and then modulated.

LTE supports several modulation, such as QPSK, 16QAM, 64QAM, and in later LTE releases, 256QAM.

QPSK carries 2 bits per symbol and is more robust, so it is useful when channel conditions are poor.

16QAM carries 4 bits per symbol and provides higher data rate.

64QAM carries 6 bits per symbol, and 256QAM carries even more bits per symbol, but they require better radio conditions.

This is part of a mechanism called link adaptation. When the channel is good, LTE can use a higher-order modulation and a higher coding rate. When the channel is poor, LTE uses a more robust modulation and stronger coding.

LTE also uses HARQ, or Hybrid Automatic Repeat Request. If the receiver cannot decode a transport block correctly, it sends a NACK. The transmitter then retransmits additional redundancy, and the receiver combines the old and new transmissions to improve decoding.

So, modulation increases data rate, while coding and HARQ improve reliability.