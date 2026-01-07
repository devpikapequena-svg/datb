export interface Produto {
  slug: string
  title: string
  img: string
  price: string
  discount: string
  oldPrice?: string
  descricao: string
}

export const produtos: Produto[] = [
  {
    slug: 'robo-programavel-inteligente-ruko-6088',
    title: 'Robô Programável Inteligente Ruko 6088 com Controle Remoto',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8927539-600-auto?v=638930303610170000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8927539-800-auto?v=638930303610170000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8927539-1200-auto?v=638930303610170000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 124,33',
    discount: '-80%',
    descricao:
      'Robô inteligente com controle remoto e detecção de gestos, ideal para crianças acima de 3 anos. Desenvolve coordenação motora e estimula a curiosidade tecnológica.',
  },
  {
    slug: 'cadeirinha-de-carro-graco-slimfit3',
    title: 'Cadeirinha de Carro Graco SlimFit3 LX 3 em 1',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8067380-600-auto?v=638786043881870000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8067380-800-auto?v=638786043881870000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8067380-1200-auto?v=638786043881870000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 121,44',
    discount: '-80%',
    descricao:
      'Cadeirinha Graco 3 em 1 com proteção lateral reforçada, conforto superior e instalação rápida. Ideal para acompanhar o crescimento da criança.',
  },
  {
    slug: 'pistolas-a-laser-recarregaveis-lcd-360',
    title: '4 Pistolas a Laser Recarregáveis com Cintos Sensores LCDs 360',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/6514731-600-auto?v=638622038432870000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/6514731-800-auto?v=638622038432870000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/6514731-1200-auto?v=638622038432870000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 132,55',
    discount: '-80%',
    descricao:
      'Conjunto de pistolas laser com sensores de impacto, recarga via USB e tela LCD. Perfeito para brincadeiras em grupo com muita ação e diversão.',
  },
  {
    slug: 'bebe-recem-nascido-jizhi',
    title: 'Bebê Recém-Nascido Newborn, Bonecas Realistas JIZHI',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8269777-600-auto?v=638833395411070000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8269777-800-auto?v=638833395411070000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8269777-1200-auto?v=638833395411070000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 124,10',
    discount: '-80%',
    descricao:
      'Boneca realista newborn com detalhes delicados e corpo maleável. Ideal para presentear e estimular o cuidado e imaginação das crianças.',
  },
  {
    slug: 'quadriciclo-eletrico-infantil-4x4',
    title: 'Quadriciclo Elétrico Infantil 4x4 24V com Controle Remoto',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8726838-600-auto?v=638908881449770000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8726838-800-auto?v=638908881449770000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8726838-1200-auto?v=638908881449770000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 189,96',
    discount: '-80%',
    descricao:
      'Quadriciclo elétrico infantil 4x4 com controle remoto e bateria 24V. Oferece segurança, potência e muita diversão ao ar livre.',
  },
  {
    slug: 'hoverboard-off-road-bluetooth',
    title: 'Hoverboard Off Road com Alto Falante Bluetooth, Luz LED, 220v',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8157132-600-auto?v=638802332344730000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8157132-800-auto?v=638802332344730000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8157132-1200-auto?v=638802332344730000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 189,34',
    discount: '-80%',
    descricao:
      'Hoverboard off-road com rodas reforçadas, som Bluetooth e luzes LED. Ideal para quem busca estilo e equilíbrio nas manobras.',
  },
  {
    slug: 'triciclo-patrulha-canina',
    title: 'Triciclo Patrulha Canina com Luzes, Sons e Armazenamento',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/6511455-600-auto?v=638622037584070000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/6511455-800-auto?v=638622037584070000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/6511455-1200-auto?v=638622037584070000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 189,60',
    discount: '-80%',
    descricao:
      'Triciclo divertido da Patrulha Canina com luzes, sons e compartimento traseiro. Perfeito para os pequenos exploradores.',
  },
  {
    slug: 'patinete-eletrico-infantil-led',
    title: 'Patinete Elétrico para Crianças de 6 a 10 anos com Luzes LED',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/9048138-600-auto?v=638941060869970000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/9048138-800-auto?v=638941060869970000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/9048138-1200-auto?v=638941060869970000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 179,53',
    discount: '-80%',
    descricao:
      'Patinete elétrico infantil com luzes LED e bateria de longa duração. Oferece equilíbrio, velocidade e muita diversão para as crianças.',
  },
  {
    slug: 'triciclo-eletrico-12v',
    title: 'Triciclo Elétrico Bateria 12V, Atinge até 14 km/h',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8965327-600-auto?v=638932313167630000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8965327-800-auto?v=638932313167630000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8965327-1200-auto?v=638932313167630000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 189,83',
    discount: '-80%',
    descricao:
      'Triciclo elétrico 12V para crianças, com design moderno e velocidade controlada. Um brinquedo seguro e empolgante!',
  },
  {
    slug: 'umidificador-dreo-6l',
    title: 'Umidificador de Ar Dreo 6 Litros: Tecnologia Avançada, 60h',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8303795-600-auto?v=638839036071500000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8303795-800-auto?v=638839036071500000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8303795-1200-auto?v=638839036071500000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 159,95',
    discount: '-80%',
    descricao:
      'Umidificador de alta performance com autonomia de 60 horas. Mantém o ar limpo e agradável, ideal para o quarto das crianças.',
  },
  {
    slug: 'aviao-controle-remoto',
    title: 'Avião de Controle Remoto com Acessórios',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8130738-600-auto?v=638796291048600000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8130738-800-auto?v=638796291048600000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8130738-1200-auto?v=638796291048600000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 129,93',
    discount: '-80%',
    descricao:
      'Avião de controle remoto completo, ideal para iniciantes. Vem com controle ergonômico e peças resistentes para voos longos.',
  },
  {
    slug: 'andador-xilingol-6-em-1',
    title: 'Andador Xilingol 6 em 1 com Rodas de Velocidade Ajustável',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8067347-600-auto?v=638786042766630000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8067347-800-auto?v=638786042766630000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8067347-1200-auto?v=638786042766630000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 179,11',
    discount: '-80%',
    descricao:
      'Andador multifuncional com design seguro e rodas ajustáveis. Auxilia no desenvolvimento e equilíbrio do bebê.',
  },
  {
    slug: 'kit-50-miniaturas-hotwheels',
    title: 'Kit com 50 Miniaturas Hot Wheels em Escala 1:64',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8980319-600-auto?v=638933968752800000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8980319-800-auto?v=638933968752800000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8980319-1200-auto?v=638933968752800000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 159,94',
    discount: '-80%',
    descricao:
      'Coleção com 50 miniaturas originais Hot Wheels. Ideal para colecionadores e amantes de velocidade.',
  },
  {
    slug: 'kit-maquiagem-infantil',
    title: 'Kit de Maquiagem Infantil com Mais de 10 Peças e Não Tóxico',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/9110199-600-auto?v=638947186178230000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/9110199-800-auto?v=638947186178230000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/9110199-1200-auto?v=638947186178230000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 99,46',
    discount: '-80%',
    descricao:
      'Kit de maquiagem infantil não tóxico com 10 peças. Desenvolvido especialmente para brincadeiras seguras e criativas.',
  },
  {
    slug: 'carrinho-acrobatico-360',
    title: 'Carrinho de Controle Remoto com Acrobacias de 360 Graus',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8166294-600-auto?v=638804074480830000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8166294-800-auto?v=638804074480830000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8166294-1200-auto?v=638804074480830000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 145,38',
    discount: '-80%',
    descricao:
      'Carrinho RC de alta performance com giros 360° e luzes LED. Perfeito para desafios e competições entre amigos.',
  },
  {
    slug: 'pista-hotwheels-ataque-tubarao',
    title: 'Pista Hot Wheels Color Change Ataque Tubarão',
    img: 'https://rihappy.vtexassets.com/arquivos/ids/8981026-600-auto?v=638934225330670000&width=600&height=auto&aspect=true 600w,https://rihappy.vtexassets.com/arquivos/ids/8981026-800-auto?v=638934225330670000&width=800&height=auto&aspect=true 800w,https://rihappy.vtexassets.com/arquivos/ids/8981026-1200-auto?v=638934225330670000&width=1200&height=auto&aspect=true 1200w',
    price: 'R$ 147,55',
    discount: '-80%',
    descricao:
      'Pista de corrida com tema de tubarão e mudança de cor dos carros. Proporciona horas de diversão com emoção e criatividade.',
  },
]
