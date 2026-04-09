export type MenuItem = {
  name: string;
  description: string;
  price?: number | null;
  priceLabel?: string;
  label?: string;
};

export type MenuCategory = {
  id: string;
  title: string;
  description: string;
  items: MenuItem[];
};

const detailedMenuCategories: MenuCategory[] = [
  {
    id: 'entradas',
    title: 'Entradas',
    description: 'Pequenos pratos e acompanhamentos para começar a refeição.',
    items: [
      { name: 'Azeitonas Temperadas', description: '', price: 1.5 },
      { name: 'Cesto de Pães e Tostas', description: '', price: 2.2 },
      { name: 'Manteiga de Ervas', description: '', price: 1.2 },
      { name: 'Patê de Atum', description: '', price: 2.2 },
      { name: 'Queijo com Azeite e Ervas', description: '', price: 4 },
      { name: 'Bruschetta Caprese', description: '', price: 4.8 },
      { name: 'Pão de Alho com Queijo', description: '', price: 4.8 },
      { name: 'Salsicha Brasileira', description: '', price: 4.5 },
      { name: 'Bolinhas de Alheira (6 uni.)', description: '', price: 4.5 }
    ]
  },
  {
    id: 'saladas',
    title: 'Saladas',
    description: 'Opções leves com composições frescas e molhos da casa.',
    items: [
      { name: 'Caesar', description: 'Alface americana, filé de frango, lascas de parmesão, bacon e croutons.', price: 14 },
      { name: 'Mista', description: 'Alface, tomate, cebola, pepino e cenoura.', price: 4.5 },
      { name: 'Verão', description: 'Alface, agrião, abacaxi, manga, mozzarella fresca, nozes e molho mostarda e mel.', price: 14 },
      { name: 'À Moda da Casa', description: 'Alface, camarão, tomate cherry, abacate e molho.', price: 16 }
    ]
  },
  {
    id: 'especialidades-da-casa',
    title: 'Especialidades da Casa',
    description: 'Pratos de assinatura com inspiração portuguesa e brasileira.',
    items: [
      {
        name: 'Feijoada à Brasileira',
        description: 'Acompanha farofa, couve refogada, arroz e molho da casa. Disponível apenas aos sábados.',
        price: null,
        priceLabel: '16 (1 pax)\n32 (2 pax)'
      },
      { name: 'Escondidinho', description: 'Puré de mandioca, carne seca e queijo.', price: 15 },
      { name: 'Bacalhau com Broa', description: 'Bacalhau com molho béchamel, grelos e crosta de broa.', price: 15 },
      { name: 'Bobó de Camarão', description: 'Puré de mandioca com leite de côco, azeite dendê, pimentos e camarão.', price: 18 },
      { name: 'Moqueca de Camarão', description: 'Servida com arroz branco e batata frita.', price: 19 },
      { name: 'Bife à Parmegiana', description: 'Bife panado com fiambre e queijo mozzarella gratinado, acompanhado de arroz branco e batata frita.', price: 19 }
    ]
  },
  {
    id: 'carnes',
    title: 'Carnes',
    description: 'Carnes grelhadas e pratos de carne com acompanhamentos clássicos.',
    items: [
      { name: 'Bitoque Grelhado', description: 'Arroz, batata frita, bife de vaca grelhado e ovo.', price: 14.5 },
      { name: 'Bife da Vázia (Argentina)', description: 'Arroz, batata frita e salada.', price: 18.5 },
      { name: 'Picanha (Argentina)', description: 'Arroz, feijão preto, batata frita, vinagrete e farofa.', price: 19 },
      { name: 'Maminha (Argentina)', description: 'Arroz, feijão preto, batata frita, vinagrete e farofa.', price: 17.5 },
      {
        name: 'Espetada Nobre',
        description: 'Serve 2 pessoas. Picanha, maminha, linguiça toscana, arroz, feijão preto, batata frita, vinagrete e farofa.',
        price: 37
      },
      { name: 'Medalhões de Filé Mignon ao Molho Madeira', description: 'Servidos com esparregado e batata frita.', price: 23 },
      { name: 'Plumas (Porco Preto)', description: 'Com arroz, batata frita e salada.', price: 15.8 },
      { name: 'Extras', description: 'Arroz, batata frita ou feijão preto.', price: 2.5 }
    ]
  },
  {
    id: 'massas',
    title: 'Massas',
    description: 'Massas clássicas, gratinadas e opções para adultos e crianças.',
    items: [
      { name: 'Esparguete Carbonara', description: 'Bacon, ovo e molho de natas.', price: 15 },
      { name: 'Esparguete Bolonhesa', description: 'Carne picada e molho de tomate.', price: 13 },
      { name: 'Esparguete Mare Monte', description: 'Camarão, cogumelos, molho de tomate e natas.', price: 17 },
      { name: 'Penne ao Forno', description: 'Molho bolonhesa, natas e mozarela.', price: 14 },
      { name: 'Penne com Legumes', description: 'Brócolos, courgete, pimentos, mozzarella, cebola, cenoura e molho de tomate.', price: 14 },
      { name: 'Lasanha Bolonhesa', description: 'Molho de natas e quatro tipos de queijo.', price: 15 },
      { name: 'Esparguete Bolonhesa Kids', description: 'Carne picada e molho de tomate. Dos 3 aos 10 anos.', price: 5 }
    ]
  },
  {
    id: 'peixe',
    title: 'Peixe',
    description: 'Pratos de peixe e marisco com acompanhamentos da casa.',
    items: [
      { name: 'Polvo à Lagareiro', description: 'Com legumes salteados e batata ao murro.', price: 18 },
      { name: 'Filetes de Salmão', description: 'Com legumes salteados e batata ao murro.', price: 16 },
      { name: 'Espetadinha de Salmão com Camarão', description: 'Com arroz à primavera e salada.', price: 16 },
      { name: 'Lulas Recheadas', description: 'Com arroz e batata frita ou puré de batata.', price: 16.5 },
      { name: 'Espetadas de Lulas', description: 'Com salada e batata frita.', price: 16.8 }
    ]
  },
  {
    id: 'sobremesas-frutas',
    title: 'Frutas',
    description: 'Fruta simples e combinações frescas para terminar a refeição.',
    items: [
      { name: 'Abacaxi', description: 'Fruta fresca.', price: 4 },
      { name: 'Manga', description: 'Fruta fresca.', price: 4.5 },
      { name: 'Abacaxi com Gelado de Limão', description: 'Fruta fresca com gelado de limão.', price: 5.5 },
      { name: 'Salada de Frutas', description: 'Mistura de fruta.', price: 3.5 }
    ]
  },
  {
    id: 'sobremesas-doces',
    title: 'Doces',
    description: 'Sobremesas clássicas, cheesecakes, mousses e doces tradicionais.',
    items: [
      { name: 'Leite Creme', description: 'Sobremesa tradicional.', price: 4 },
      { name: 'Baba de Camelo', description: 'Sobremesa tradicional.', price: 3.8 },
      { name: 'Cheesecake de Frutos Vermelhos', description: 'Cheesecake com cobertura de frutos vermelhos.', price: 4.5 },
      { name: 'Cheesecake de Maracujá', description: 'Cheesecake com maracujá.', price: 4.5 },
      { name: 'Cheesecake de Banoffe', description: 'Cheesecake estilo banoffe.', price: 5 },
      { name: 'Cheesecake de Goiabada', description: 'Cheesecake com goiabada.', price: 5 },
      { name: 'Panacota', description: 'Disponível em frutos vermelhos, manga ou maracujá.', price: 4.5 },
      { name: 'Mousse de Chocolate', description: 'Mousse clássica.', price: 3.8 },
      { name: 'Mousse de Lima', description: 'Mousse de lima.', price: 4 },
      { name: 'Mousse de Maracujá', description: 'Mousse de maracujá.', price: 4 },
      { name: 'Quindim', description: 'Doce tradicional.', price: 4 }
    ]
  },
  {
    id: 'sobremesas-crepes-gelados',
    title: 'Crepes e Gelados',
    description: 'Crepes servidos com gelado e sugestões doces variadas.',
    items: [
      { name: 'Crepe de Banoffe', description: 'Bola de gelado, chantilly, banana em rodelas e doce de leite.', price: 5.8 },
      { name: 'Crepe de Chocolate', description: 'Bola de gelado de chocolate, chantilly, topping e raspas de chocolate.', price: 5.8 },
      { name: 'Crepe de Banana e Mel', description: 'Bola de gelado de baunilha, chantilly, banana em rodelas, mel e amêndoas.', price: 5.8 },
      { name: 'Crepe de Frutos Vermelhos', description: 'Bola de gelado de morango, calda de frutos vermelhos, chantilly e fruta fresca.', price: 5.8 },
      { name: 'Crepe Tropical', description: 'Bola de gelado de manga, calda de maracujá, chantilly, manga e abacaxi.', price: 5.8 },
      { name: 'Taça de Gelado', description: '2 bolas. Sabores: chocolate, morango, baunilha ou limão.', price: 4 }
    ]
  },
  {
    id: 'bebidas',
    title: 'Bebidas',
    description: 'Cocktails, sumos naturais, cervejas, sangrias, águas, refrigerantes e cafetaria.',
    items: [
      { name: 'Caipirinha Tradicional', description: '', price: 5, label: 'Bebidas' },
      { name: 'Caipirinha de Maracujá', description: '', price: 6, label: 'Bebidas' },
      { name: 'Caipirinha de Abacaxi com Hortelã', description: '', price: 6, label: 'Bebidas' },
      { name: 'Caipirinha de Frutos Vermelhos', description: '', price: 6, label: 'Bebidas' },
      { name: 'Caipiroska', description: '', price: 6, label: 'Bebidas' },
      { name: 'Sakerinha', description: '', price: 6, label: 'Bebidas' },
      { name: 'Mojito', description: '', price: 7, label: 'Bebidas' },
      { name: 'Aperol', description: '', price: 7, label: 'Bebidas' },
      { name: 'Margarita', description: '', price: 7, label: 'Bebidas' },
      { name: 'Mojito', description: '', price: 5, label: 'Sem alcool' },
      { name: 'Cocktail de Frutos', description: '', price: 5, label: 'Sem alcool' },
      { name: 'Hendricks', description: '', price: 9, label: 'Gins' },
      { name: 'Haymans', description: '', price: 8, label: 'Gins' },
      { name: 'Gordons', description: '', price: 7, label: 'Gins' },
      { name: 'Sumo Natural de Laranja', description: '', price: 3, label: 'Sumos naturais' },
      { name: 'Sumo Natural de Abacaxi com Hortelã', description: '', price: 3.5, label: 'Sumos naturais' },
      { name: 'Limonada', description: '', price: 3, label: 'Sumos naturais' },
      { name: 'Sumo Natural de Laranja com Morango', description: '', price: 4, label: 'Sumos naturais' },
      { name: 'Vitalis (50cl)', description: '', price: 1.8, label: 'Aguas' },
      { name: 'Água das Pedras', description: '', price: 1.9, label: 'Aguas' },
      { name: 'Água das Pedras Sabores', description: '', price: 1.9, label: 'Aguas' },
      { name: 'Água Castelo', description: '', price: 1.8, label: 'Aguas' },
      { name: 'Sumersby', description: '', price: 2.9, label: 'Cerveja' },
      { name: 'Cerveja Stout', description: '', price: 2.3, label: 'Cerveja' },
      { name: 'Cerveja Green', description: '', price: 2.3, label: 'Cerveja' },
      { name: 'Super Bock', description: '', price: 2.2, label: 'Cerveja' },
      { name: 'Cerveja sem Álcool', description: '', price: 2.3, label: 'Cerveja' },
      { name: 'Carlsberg', description: '', price: 2.2, label: 'Cerveja' },
      { name: 'Imperial (20cl)', description: '', price: 1.9, label: 'Cerveja' },
      { name: 'Tulipa (40cl)', description: '', price: 3.4, label: 'Cerveja' },
      { name: 'Caneca (50cl)', description: '', price: 3.9, label: 'Cerveja' },
      { name: 'Sangria Branca ou Tinta (100cl)', description: '', price: 14, label: 'Sangria' },
      { name: 'Sangria de Maracujá (100cl)', description: '', price: 16, label: 'Sangria' },
      { name: 'Sangria de Frutos Vermelhos (100cl)', description: '', price: 16, label: 'Sangria' },
      { name: 'Sangria de Espumante (100cl)', description: '', price: 18, label: 'Sangria' },
      { name: 'Sangria Azul (100cl)', description: '', price: 16, label: 'Sangria' },
      { name: 'Taça de Sangria Branca ou Tinta', description: '', price: 4.5, label: 'Sangria' },
      { name: 'Taça de Sangria de Frutos Vermelhos', description: '', price: 5, label: 'Sangria' },
      { name: 'Café', description: '', price: 1.2, label: 'Cafetaria' },
      { name: 'Descafeinado', description: '', price: 1.3, label: 'Cafetaria' },
      { name: 'Chás', description: '', price: 1.5, label: 'Cafetaria' }
    ]
  },
  {
    id: 'whiskys',
    title: 'Whisky’s',
    description: 'Seleção de whisky servida em dose de 0,05cl.',
    items: [
      { name: 'Cutty Sark', description: '', price: 4.5, label: 'Whisky' },
      { name: 'Famous Grouse', description: '', price: 4.5, label: 'Whisky' },
      { name: 'Bushmills', description: '', price: 5.5, label: 'Whisky' },
      { name: 'Jameson', description: '', price: 5.5, label: 'Whisky' },
      { name: 'Black Label', description: '', price: 8, label: 'Whisky' },
      { name: 'Cardhu', description: '', price: 9.5, label: 'Whisky' },
      { name: 'Old Parr', description: '', price: 10, label: 'Whisky' }
    ]
  },
  {
    id: 'aguardentes-licores-digestivos',
    title: 'Aguardentes, Licores e Digestivos',
    description: 'Aguardentes vínicas, licores e digestivos.',
    items: [
      { name: 'CRF', description: '', price: 5, label: 'Aguardantes' },
      { name: 'Macieira', description: '', price: 3.5, label: 'Aguardantes' },
      { name: 'Aliança Velha', description: '', price: 4, label: 'Aguardantes' },
      { name: 'Antiqua', description: '', price: 4.5, label: 'Aguardantes' },
      { name: 'Fim de Século', description: '', price: 4, label: 'Aguardantes' },
      { name: 'Adega Velha', description: '', price: 13, label: 'Aguardantes' },
      { name: 'Beirão', description: '', price: 4, label: 'Aguardantes' },
      { name: 'Amêndoa Amarga', description: '', price: 4, label: 'Aguardantes' },
      { name: 'Baileys', description: '', price: 4, label: 'Aguardantes' },
      { name: 'Moscatel Favaios', description: '', price: 3, label: 'Aguardantes' },
      { name: 'Moscatel 5 Anos', description: '', price: 4.5, label: 'Aguardantes' }
    ]
  },
  {
    id: 'sushi-entradas',
    title: 'Sushi · Entradas',
    description: 'Entradas e preparações frias da secção sushi.',
    items: [
      { name: 'Sopa Missoshiro', description: 'Misso, wakame e cebolinho.', price: 3.5 },
      { name: 'Tartar Avocado', description: 'Mix de peixes, molho kimuche e abacate.', price: 11 },
      { name: 'Tartar Tradicional', description: 'Mix de peixes, molho kimuche, espargos e alho francês.', price: 11 },
      { name: 'Shake Hara', description: '10 fatias de sashimi de barriga de salmão, servidas com molho levemente picante, sésamo e crispy de batata doce.', price: 14 },
      { name: 'Tataki', description: '10 fatias de sashimi de atum em crosta de sésamo, molho ponzu, ovas de massagô e cebola caramelizada.', price: 14 },
      { name: 'Guioza', description: '6 unidades de frango com vegetais.', price: 7.5 },
      { name: 'Tiradito de Salmão', description: '7 fatias de salmão braseadas, molho do chefe, chips de batata doce e sésamo.', price: 8.5 },
      { name: 'Tiradito de Atum', description: '7 fatias de atum braseadas, molho do chefe, chips de batata doce e sésamo.', price: 9.5 },
      { name: 'Ceviche Tradicional', description: 'Cubos de peixe branco com molho tradicional peruano.', price: 9 },
      { name: 'Ceviche de Salmão', description: 'Cubos de salmão, molho cítrico e cebola roxa.', price: 8.5 },
      { name: 'Ceviche Especial', description: 'Mix de 3 peixes marinados em molho cítrico servido com camarão e polvo.', price: 11 }
    ]
  },
  {
    id: 'sushi-carpaccio',
    title: 'Sushi · Carpaccio',
    description: 'Carpaccios com peixe e polvo servidos com molhos e acabamentos especiais.',
    items: [
      { name: 'Carpaccio de Salmão', description: 'Fatias de salmão, molho ponzu e azeite trufado.', price: 12 },
      { name: 'Carpaccio Barriga de Salmão', description: 'Fatias de barriga de salmão, molho ponzu, raspas de lima e sésamo.', price: 14 },
      { name: 'Carpaccio Especial do Chefe', description: '20 fatias de peixes mix, molho especial, chips de batata doce e ovas massago.', price: 19 },
      { name: 'Carpaccio de Polvo', description: 'Polvo servido com molho de ervas e ponzu.', price: 11 }
    ]
  },
  {
    id: 'sushi-temaki',
    title: 'Sushi · Temaki',
    description: 'Temakis preparados na hora com peixe, marisco e opções especiais.',
    items: [
      { name: 'Temaki Salmão', description: 'Temaki.', price: 6 },
      { name: 'Temaki de Salmão com Cream Cheese', description: 'Temaki.', price: 6.5 },
      { name: 'Temaki Atum', description: 'Temaki.', price: 7 },
      { name: 'Temaki Peixe Branco com Lima', description: 'Temaki.', price: 7 },
      { name: 'Temaki Camarão Empanado com Maionese e Sweetchilli', description: 'Temaki.', price: 7.5 },
      { name: 'Temaki Camarão', description: 'Temaki.', price: 6.5 },
      { name: 'Temaki Salmão Panado', description: 'Temaki.', price: 7.5 },
      { name: 'Temaki Skin', description: 'Temaki.', price: 5.5 },
      { name: 'Temaki Califórnia', description: 'Kani, manga e pepino.', price: 5 },
      { name: 'Temaki do Chefe', description: 'Mix de peixes, vieira, ovas de massago, lima e especiaria final do chefe.', price: 8.5 },
      { name: 'Temaki Frito de Salmão', description: 'Salmão com cream cheese, panado e frito.', price: 8 }
    ]
  },
  {
    id: 'sushi-nigiri',
    title: 'Sushi · Nigiri',
    description: 'Nigiris servidos em pares, com opções tradicionais e especiais.',
    items: [
      { name: 'Nigiri de Salmão, Atum ou Peixe Branco', description: '2 unidades.', price: 4.2, label: '2 unidades' },
      { name: 'Nigiri Camarão', description: '2 unidades.', price: 4.5, label: '2 unidades' },
      { name: 'Nigiri Polvo', description: '2 unidades.', price: 5.2, label: '2 unidades' },
      { name: 'Nigiri Salmão Selado com Azeite Trufado e Raspas de Lima', description: '2 unidades.', price: 4.8, label: '2 unidades' },
      { name: 'Nigiri de Vieira', description: '2 unidades.', price: 6, label: '2 unidades' },
      { name: 'Nigiri de Enguia', description: '2 unidades.', price: 6, label: '2 unidades' },
      { name: 'Nigiri Barriga de Salmão', description: '2 unidades.', price: 5.5, label: '2 unidades' },
      { name: 'Nigiri Skin', description: '2 unidades.', price: 4.5, label: '2 unidades' },
      { name: 'Nigiri do Chefe', description: 'Seleção de 5 nigiris com toque especial do chefe.', price: 11 }
    ]
  },
  {
    id: 'sushi-gunkan',
    title: 'Sushi · Gunkan',
    description: 'Gunkans servidos em pares, com peixe, marisco e ovas.',
    items: [
      { name: 'Gunkan Salmão', description: '2 unidades.', price: 4.5, label: '2 unidades' },
      { name: 'Gunkan Atum', description: '2 unidades.', price: 4.8, label: '2 unidades' },
      { name: 'Gunkan Peixe Branco', description: '2 unidades.', price: 4.8, label: '2 unidades' },
      { name: 'Gunkan Salmão Selado ao Molho de Maracujá', description: '2 unidades.', price: 4.8, label: '2 unidades' },
      { name: 'Gunkan Atum com Ovos de Codorniz e Azeite Trufado', description: '2 unidades.', price: 5, label: '2 unidades' },
      { name: 'Gunkan Especial de Camarão', description: '2 unidades.', price: 5.5, label: '2 unidades' },
      { name: 'Gunkan Cogumelos', description: '2 unidades.', price: 4.5, label: '2 unidades' },
      { name: 'Gunkan Vieira e Salmão', description: 'Vieira trufada, wakame e ovas. 2 unidades.', price: 6, label: '2 unidades' },
      { name: 'Gunkan Vieira e Atum', description: '2 unidades.', price: 6.5, label: '2 unidades' },
      { name: 'Gunkan Ovas', description: 'Gunkan envolto de algas, com ovas. 2 unidades.', price: 5.5, label: '2 unidades' },
      { name: 'Gunkan do Chefe', description: 'Seleção de 5 gunkans com toque especial do chefe.', price: 11 }
    ]
  },
  {
    id: 'sushi-sashimi',
    title: 'Sushi · Sashimi',
    description: 'Sashimi em várias opções de peixe e combinações do chefe.',
    items: [
      { name: 'Sashimi Salmão', description: '5 ou 10 unidades: 6 / 11.', price: null },
      { name: 'Sashimi Atum', description: '5 ou 10 unidades: 7 / 13.', price: null },
      { name: 'Sashimi Peixe Branco', description: '5 ou 10 unidades: 7 / 13.', price: null },
      { name: 'Sashimi Polvo', description: '5 ou 10 unidades: 8 / 14.', price: null },
      { name: 'Sashimi do Chefe', description: '10 ou 20 peças criadas e temperadas pelo chefe: 18 / 28.', price: null }
    ]
  },
  {
    id: 'sushi-hossomaki',
    title: 'Sushi · Hossomaki',
    description: 'Hossomakis servidos em 8 unidades.',
    items: [
      { name: 'Hossomaki Atum ou Salmão', description: '8 unidades.', price: 8, label: '8 unidades' },
      { name: 'Hossomaki Camarão', description: '8 unidades.', price: 9, label: '8 unidades' },
      { name: 'Hossomaki Pepino', description: '8 unidades.', price: 6, label: '8 unidades' },
      { name: 'Hossomaki Manga', description: '8 unidades.', price: 6, label: '8 unidades' }
    ]
  },
  {
    id: 'sushi-uramaki-futomaki',
    title: 'Sushi · Uramaki e Futomaki',
    description: 'Uramakis e futomakis em versões de 4 ou 8 unidades.',
    items: [
      { name: 'Uramaki Salmão', description: 'Salmão com cream cheese, sésamo e cebolinha. 4 ou 8 unidades: 6 / 11.', price: null },
      { name: 'Uramaki Atum', description: 'Atum com kimuche, sésamo e cebolinha. 4 ou 8 unidades: 7 / 13.', price: null },
      { name: 'Uramaki Califórnia', description: 'Salmão, abacate e camarão. 4 ou 8 unidades: 7 / 13.', price: null },
      { name: 'Uramaki Salmão Empanado', description: 'Salmão empanado com abacate e cream cheese. 4 ou 8 unidades: 7 / 13.', price: null },
      { name: 'Uramaki Camarão Empanado', description: 'Camarão empanado com maionese e sweetchilli. 4 ou 8 unidades: 7,50 / 14.', price: null },
      { name: 'Uramaki Especial de Camarão', description: 'Camarão empanado, cream cheese, delícias do mar, pepino e lâminas de salmão. 4 ou 8 unidades: 7 / 13.', price: null },
      { name: 'Uramaki Vegetariano', description: 'Abacate, maionese, cogumelos, creme cheese e espargos. 4 ou 8 unidades: 7 / 13.', price: null },
      { name: 'Futomaki Especial', description: 'Camarão empanado, abacate, rúcula e maionese japonesa. 4 ou 8 unidades: 7 / 14.', price: null },
      { name: 'Futomaki Vegetariano', description: 'Tomate seco, creme cheese e rúcula. 4 ou 8 unidades: 7 / 13.', price: null }
    ]
  },
  {
    id: 'sushi-hot-roll',
    title: 'Sushi · Hot Roll',
    description: 'Hot rolls e peças quentes da secção sushi.',
    items: [
      { name: 'Hot Roll', description: 'Salmão e cream cheese fritos em farinha panko. 5 ou 10 unidades: 7 / 13.', price: null },
      { name: 'Hot Roll Huramaki', description: 'Feito com massa de spring roll, tomate seco, rúcula, camarão e molho tarê.', price: 13 },
      { name: 'Hot Roll Especial', description: 'Massa spring roll, ovas de massagô, salmão e alho francês.', price: 13 },
      { name: 'Hot Salmão Ebi', description: 'Salmão, camarão e cream cheese. 5 ou 10 unidades: 7,50 / 14.', price: null },
      { name: 'Hot Tempurá', description: 'Alga, salmão, cream cheese e alho francês frito em farinha tempurá. 5 ou 10 unidades: 7,50 / 14.', price: null }
    ]
  },
  {
    id: 'sushi-combos',
    title: 'Sushi · Combos e Combinados',
    description: 'Combos variados e combinados especiais de sushi.',
    items: [
      { name: 'Sushi 1', description: '12 peças: 2 uramaki atum, 2 uramaki salmão, 2 nigiri salmão, 2 nigiri camarão, 2 gunkan salmão e 2 hossomaki.', price: 15.9 },
      { name: 'Sushi 2', description: '30 peças: seleção variada de uramaki, nigiri, gunkan, hossomaki e hots.', price: 34.9 },
      { name: 'Sushi Vegetariano', description: '16 peças: 4 nigiri, 4 uramaki, 4 hossomaki e 4 gunkan.', price: 18.5 },
      { name: 'Combinado Especial do Chefe', description: 'Para 2 pessoas. Entrada com 16 fatias de carpaccio misto com molho do dia, 20 peças de sashimi variados e 20 peças de sushis variados.', price: 63 },
      { name: 'Combinado Richard’s', description: 'Entrada: 2 guiozas, 3 fatias de carpaccio salmão e 1 tartar. Preço: almoço de segunda a sexta 20; jantar 22,50; sábados, domingos e feriados 22,50.', price: null },
      { name: 'Combinado 1', description: '18 peças: 6 sashimi variados, 2 nigiri peixe branco, 2 uramaki salmão, 2 gunkan atum, 2 hossomaki pepino e 4 hots.', price: 21.9 },
      { name: 'Combinado 2', description: '34 peças: 12 sashimi variados, uramakis, nigiris, gunkans e hots.', price: 41.9 },
      { name: 'Combinado 3', description: '51 peças: sashimi variados, uramakis, nigiris, gunkans e hots.', price: 59.9 },
      { name: 'Combinado 4', description: '22 peças só de salmão: 8 sashimis, 4 uramakis, 2 hossomakis, 2 nigiris, 2 gunkans e 4 hots tempurá.', price: 24 }
    ]
  }
];

function pickItems(categoryIds: string[]) {
  return categoryIds
    .map((categoryId) => detailedMenuCategories.find((category) => category.id === categoryId))
    .filter((category): category is MenuCategory => Boolean(category))
    .flatMap((category) =>
      category.items.map((item) => ({
        ...item,
        label: item.label ?? category.title
      }))
    );
}

export const menuCategories: MenuCategory[] = [
  {
    id: 'comecar',
    title: 'Começar',
    description: 'Entradas e sugestões leves para iniciar a refeição.',
    items: pickItems(['entradas'])
  },
  {
    id: 'cozinha-da-casa',
    title: 'Cozinha da Casa',
    description: 'Especialidades, carnes, peixe, massas e saladas reunidos numa leitura mais simples.',
    items: pickItems(['especialidades-da-casa', 'carnes', 'peixe', 'massas', 'saladas'])
  },
  {
    id: 'sobremesas',
    title: 'Sobremesas',
    description: 'Fruta, doces, crepes e gelados num único grupo mais fácil de explorar.',
    items: pickItems(['sobremesas-frutas', 'sobremesas-doces', 'sobremesas-crepes-gelados'])
  },
  {
    id: 'bar-bebidas',
    title: 'Bar e Bebidas',
    description: 'Cocktails, cervejas, sangrias, cafetaria, whiskys e digestivos.',
    items: pickItems(['bebidas', 'whiskys', 'aguardentes-licores-digestivos'])
  },
  {
    id: 'sushi-bar',
    title: 'Sushi Bar',
    description: 'Toda a carta sushi agrupada num único bloco para navegação mais fluida.',
    items: pickItems([
      'sushi-entradas',
      'sushi-carpaccio',
      'sushi-temaki',
      'sushi-nigiri',
      'sushi-gunkan',
      'sushi-sashimi',
      'sushi-hossomaki',
      'sushi-uramaki-futomaki',
      'sushi-hot-roll',
      'sushi-combos'
    ])
  }
];
