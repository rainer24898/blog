---
title: {{ replace .File.ContentBaseName "-" " " | title | jsonify }}
slug: {{ .File.ContentBaseName | jsonify }}
date: {{ .Date | jsonify }}
draft: true
description: ""
categories: []
tags: []
math: true
---
