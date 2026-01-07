export const banners = [
  { 
    src: '/recarregue-seus-diamantes-ganhe-o-dobro-1.jpg', 
    alt: 'Banner Recarregue em Dobro' 
  },
  { 
    src: '/77EA32E48F86033D.jpg', 
    alt: 'Banner 5'
  },
  { 
    src: '/47BED91C7ABCF1EA.png', 
    alt: 'Banner Novo' 
  },
];

export const diamondPacks = [
  { id: 'pack-100', name: '100 Diamantes', originalAmount: '100', bonusAmount: '100', totalAmount: '200', price: 6.00, formattedPrice: 'R$ 6,00' },
  { id: 'pack-310', name: '310 Diamantes', originalAmount: '310', bonusAmount: '310', totalAmount: '620', price: 7.90, formattedPrice: 'R$ 7,90' },
  { id: 'pack-520', name: '520 Diamantes', originalAmount: '520', bonusAmount: '520', totalAmount: '1.040', price: 9.90, formattedPrice: 'R$ 9,90' },
  { id: 'pack-1060', name: '1.060 Diamantes', originalAmount: '1.060', bonusAmount: '1.060', totalAmount: '2.120', price: 14.90, formattedPrice: 'R$ 14,90' },
  { id: 'pack-2180', name: '2.180 Diamantes', originalAmount: '2.180', bonusAmount: '2.180', totalAmount: '4.360', price: 19.90, formattedPrice: 'R$ 19,90' },
  { id: 'pack-5600', name: '5.600 Diamantes', originalAmount: '5.600', bonusAmount: '5.600', totalAmount: '11.200', price: 37.80, formattedPrice: 'R$ 37,80' },
  { id: 'pack-15600', name: '15.600 Diamantes', originalAmount: '15.600', bonusAmount: '15.600', totalAmount: '31.200', price: 87.80, formattedPrice: 'R$ 87,80' },
];

export const specialOffers = [
  { id: 'offer-weekly-sub', name: 'Assinatura Semanal', image: '/ffer-weekly-sub.png', price: 19.99, formattedPrice: 'R$ 19,99', originalAmount: '1.000', bonusAmount: '300', totalAmount: '1.300' },
  { id: 'offer-monthly-sub', name: 'Assinatura Mensal', image: '/offer-monthly-sub.png', price: 32.90, formattedPrice: 'R$ 32,90', originalAmount: '2.000', bonusAmount: '600', totalAmount: '2.600' },
  { id: 'offer-booyah-pass', name: 'Passe Booyah', image: '/offer-booyah-pass.png', price: 34.90, formattedPrice: 'R$ 34,90', originalAmount: '1.000', bonusAmount: 'Passe Booyah', totalAmount: 'Passe Booyah' },
  { id: 'offer-level-pack', name: 'Passe de Nível', image: '/offer-level-pack.png', price: 74.80, formattedPrice: 'R$ 74,80', originalAmount: '7.800', bonusAmount: '5.600', totalAmount: '13.400' }
];

export const upsellOffers = [
  { id: 'upsell-5600', name: '5.600 Diamantes', originalAmount: '5.600', bonusAmount: '0', totalAmount: '5.600', price: 14.90, formattedPrice: 'R$ 14,90' },
];

export const premiumStatusOffer = [
  { id: 'status-premium', name: 'Influencer Beta', originalAmount: '', bonusAmount: '', totalAmount: 'Influencer Beta', price: 67.80, formattedPrice: 'R$ 67,80', image: '/status-premium-banner.webp' }
];

export const downsellOffers = [
  { id: 'downsell-bonus', name: '5.600 Diamantes +399 Bônus', originalAmount: '5.600', bonusAmount: '399', totalAmount: '5.999', price: 17.80, formattedPrice: 'R$ 17,80' },
];

export const taxOffer = [
  { id: 'tax-release', name: 'Taxa de Liberação Imediata', originalAmount: '', bonusAmount: '', totalAmount: 'Liberação', price: 19.90, formattedPrice: 'R$ 19,90' }
];

export const skinOffers = [
  { id: 'skin-itachi', name: 'Skin Itachi', price: 14.90, formattedPrice: 'R$ 14,90', image: '/Screenshot-26.webp' },
  { id: 'skin-madara', name: 'Skin Madara', price: 18.70, formattedPrice: 'R$ 18,70', image: '/Screenshot-28.webp' },
  { id: 'skin-minato', name: 'Skin Minato', price: 9.90, formattedPrice: 'R$ 9,90', image: '/Screenshot-29.webp' },
  { id: 'skin-obito', name: 'Skin Obito', price: 14.90, formattedPrice: 'R$ 14,90', image: '/Screenshot-30.webp' },
  { id: 'skin-orochimaru', name: 'Skin Orochimaru', price: 9.90, formattedPrice: 'R$ 9,90', image: '/Screenshot-27.webp' },
];

export const paymentMethods = [
  { id: 'payment-pix', name: 'PIX', displayName: 'Pix via PagSeguro', image: '/pix_boa_mb.png', type: 'pix' },
  { id: 'payment-cc', name: 'Credit Card', displayName: 'Cartão de Crédito via PagSeguro', image: '/creditcard_mb.png', type: 'cc' },
  { id: 'payment-picpay', name: 'PicPay', displayName: 'PicPay via Loja dos Gamers', image: '/picpay_mb.png', type: 'pix' },
  { id: 'payment-nupay', name: 'Nupay', displayName: 'NuPay via Loja dos Gamers', image: '/br_nupay_mb.png', type: 'pix' },
  { id: 'payment-mercadopago', name: 'Mercado Pago', displayName: 'Mercado Pago', image: '/mx_mercado_mb.png', type: 'pix' },
];

export const specialOfferItems = [
  { id: 'sombra-roxa', name: 'Sombra Roxa', price: 9.99, originalPrice: 99.99, image: '/Screenshot-35.webp' },
  { id: 'barba-velho', name: 'Barba do Velho', price: 9.99, originalPrice: 99.99, image: '/Screenshot-32.webp' },
  { id: 'dima-bonus', name: 'Pacote Coelhão', price: 4.99, originalPrice: 49.99, image: '/Screenshot-33.webp' },
  { id: 'calca-angelical', name: 'Calça Angelical Azul', price: 14.99, originalPrice: 149.90, image: '/Screenshot-31.webp' },
  { id: 'dunk-master', name: 'Dunk Master', price: 7.50, originalPrice: 75.90, image: '/Screenshot-34.webp' },
];

export const deltaForcePacks = [
  { id: 'df-pack-60', name: '60 Delta Coins', originalAmount: '60', bonusAmount: '39', totalAmount: '99', price: 4.89, formattedPrice: 'R$ 4,89' },
  { id: 'df-pack-300', name: '300 Delta Coins', originalAmount: '300', bonusAmount: '181', totalAmount: '481', price: 9.49, formattedPrice: 'R$ 9,49' },
  { id: 'df-pack-680', name: '680 Delta Coins', originalAmount: '680', bonusAmount: '307', totalAmount: '987', price: 19.90, formattedPrice: 'R$ 19,90' },
  { id: 'df-pack-1280', name: '1.280 Delta Coins', originalAmount: '1.280', bonusAmount: '1.280', totalAmount: '2.560', price: 37.99, formattedPrice: 'R$ 37,99', promo: 'COINS EM DOBRO' },
  { id: 'df-pack-3280', name: '3.280 Delta Coins', originalAmount: '3.280', bonusAmount: '3.280', totalAmount: '6.560', price: 97.99, formattedPrice: 'R$ 97,99', promo: 'COINS EM DOBRO' },
  { id: 'df-pack-6480', name: '6.480 Delta Coins', originalAmount: '6.480', bonusAmount: '2.916', totalAmount: '9.396', price: 149.90, formattedPrice: 'R$ 149,90' },
];

export const deltaForceSpecialOffers = [
  { id: 'df-offer-genesis', name: 'Black Hawk Down - Gênesis', image: '/df-offer-genesis.webp', price: 29.90, formattedPrice: 'R$ 29,90', originalAmount: 'Gênesis', bonusAmount: '', totalAmount: 'Gênesis' },
  { id: 'df-offer-reinvention', name: 'Black Hawk Down - Reinvenção', image: '/df-offer-reinvention.webp', price: 14.90, formattedPrice: 'R$ 14,90', originalAmount: 'Reinvenção', bonusAmount: '', totalAmount: 'Reinvenção' },
  { id: 'df-offer-tide', name: 'Suprimentos de Maré', image: '/df-offer-tide.webp', price: 5.99, formattedPrice: 'R$ 5,99', originalAmount: 'Maré', bonusAmount: '', totalAmount: 'Maré' },
  { id: 'df-offer-tide-advanced', name: 'Suprimentos de Maré - Avançado', image: '/df-offer-tide-advanced.webp', price: 7.50, formattedPrice: 'R$ 7,50', originalAmount: 'Avançado', bonusAmount: '', totalAmount: 'Avançado' }
];
