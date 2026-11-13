---
id: conversion-funnel
title: Funil de conversão com taxas entre etapas
category: chart
summary: Etapas do funil em barras decrescentes alinhadas à esquerda, com volume e % do topo, taxa de passagem entre cada etapa e a maior perda destacada como "gargalo". Comparação com o período anterior em texto (pontos percentuais).
themes: [clean-saas, aurora, editorial]
products: [saas, ecommerce, marketplace, crm, subscription, edtech, landing]
motion: low
tech: css-js
deps: []
a11y: Lista ordenada de etapas com volume, % do topo e taxa de passagem em texto; gargalo marcado com palavra e ícone além da cor; botão de cada etapa leva à lista filtrada.
perf: HTML/CSS (largura por custom property); números formatados uma vez com Intl; nada de trapézios em SVG que distorcem a leitura.
reference_name: Amplitude (Funnel analysis)
reference_url: https://amplitude.com/explore/analytics/funnel-analysis
react: Componente Funnel com steps [{ label, value }]; taxas e gargalo calculados no componente.
status: stable
---

## Quando usar
- Onde o usuário desiste: checkout, cadastro, pipeline de vendas, onboarding.

## Evite
- Funil em trapézio 3D: a área engana a leitura.
- Só a % do topo: a taxa entre etapas é que mostra onde agir.
- Etapas que não são sequenciais.

## Implementação
- Barras alinhadas à esquerda, mesma altura, largura proporcional ao volume.
- Entre etapas: "↓ 42% seguiram" e, no gargalo, o volume perdido ("1.240 saíram aqui").
- Variação vs período anterior em pontos percentuais (p.p.), não em %.
