import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Category from '../models/Category.js';
import Brand from '../models/Brand.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Cart from '../models/Cart.js';
import Wishlist from '../models/Wishlist.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nordinestore');
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    // Clear all existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Cart.deleteMany({});
    await Wishlist.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await Notification.deleteMany({});

    console.log('Database cleared...');

    // Seed Users
    const users = await User.create([
      {
        name: 'Administrateur Système',
        email: 'admin@nordinestore.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      },
      {
        name: 'Karim Reparations',
        email: 'client@nordinestore.com',
        password: 'client123',
        role: 'client',
        clientType: 'demi-gros',
        isVerified: true,
        addresses: [
          {
            label: 'Atelier Alger',
            street: '12 Rue Didouche Mourad',
            city: 'Alger Center',
            state: 'Alger',
            postalCode: '16000',
            country: 'Algérie',
            phone: '+213 550 12 34 56',
            isDefault: true
          }
        ]
      }
    ]);

    const adminUser = users[0];
    const clientUser = users[1];

    // Initialize Cart and Wishlist for users
    await Cart.create({ user: adminUser._id, items: [] });
    await Wishlist.create({ user: adminUser._id, products: [] });

    await Cart.create({ user: clientUser._id, items: [] });
    await Wishlist.create({ user: clientUser._id, products: [] });

    console.log('Users seeded...');

    // Seed Categories in French
    const categories = await Category.create([
      {
        name: 'Écrans OLED & LCD',
        description: 'Modules d\'affichage et d\'écran de remplacement pour smartphones haut de gamme',
        image: 'https://images.unsplash.com/photo-1581091870622-02607f7c8ce4?w=500&auto=format&fit=crop'
      },
      {
        name: 'Batteries Li-ion',
        description: 'Cellules de batterie certifiées conformes aux capacités originales',
        image: 'https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=500&auto=format&fit=crop'
      },
      {
        name: 'Connecteurs & Ports de Charge',
        description: 'Nappes flexibles de charge USB-C, micro-USB et prises jack de rechange',
        image: 'https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=500&auto=format&fit=crop'
      },
      {
        name: 'Composants Soudables & IC',
        description: 'Puces de gestion d\'énergie, puces réseau, et micro-soudures pour carte mère',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop'
      },
      {
        name: 'Accessoires de Protection',
        description: 'Verres trempés de qualité professionnelle et coques de protection antichoc',
        image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop'
      }
    ]);

    console.log('Categories seeded...');

    // Seed Brands with REAL LOGOS (SimpleIcons Crisp SVGs for dark luxury theme)
    const brands = await Brand.create([
      {
        name: 'Apple',
        description: 'Composants de rechange certifiés et Service Pack pour iPhone et iPad',
        logo: 'https://cdn.simpleicons.org/apple/ffffff'
      },
      {
        name: 'Samsung',
        description: 'Écrans Super AMOLED originaux et batteries d\'origine Samsung Service Pack',
        logo: 'https://cdn.simpleicons.org/samsung/ffffff'
      },
      {
        name: 'Xiaomi',
        description: 'Pièces détachées d\'origine pour Redmi, Poco et gammes Mi',
        logo: 'https://cdn.simpleicons.org/xiaomi/ff6700'
      },
      {
        name: 'OnePlus',
        description: 'Modules d\'affichage fluides et batteries pour la gamme OnePlus',
        logo: 'https://cdn.simpleicons.org/oneplus/f50014'
      },
      {
        name: 'Google',
        description: 'Pièces d\'origine et écrans OLED pour smartphones Google Pixel',
        logo: 'https://cdn.simpleicons.org/google/ffffff'
      },
      {
        name: 'Huawei',
        description: 'Composants officiels pour réparation d\'appareils Huawei et Honor',
        logo: 'https://cdn.simpleicons.org/huawei/ff0000'
      },
      {
        name: 'Oppo',
        description: 'Composants de rechange et Service Pack d\'origine pour terminaux Oppo',
        logo: 'https://cdn.simpleicons.org/oppo/008a24'
      },
      {
        name: 'Sony',
        description: 'Dalles d\'affichage et pièces détachées pour téléphones Xperia',
        logo: 'https://cdn.simpleicons.org/sony/ffffff'
      },
      {
        name: 'Realme',
        description: 'Pièces détachées d\'origine pour les gammes Realme et Narzo',
        logo: 'https://cdn.simpleicons.org/realme/ffc800'
      }
    ]);

    console.log('Brands seeded...');

    // Seed Products (15 detailed items in French, realistic specs & B2B prices)
    await Product.create([
      // 1. OLED Screens
      {
        name: 'Écran OLED Original iPhone 15 Pro Max',
        sku: 'IP15PM-SCR-OLED',
        description: 'Écran de remplacement Super Retina XDR OLED original pour iPhone 15 Pro Max. Supporte TrueTone.',
        longDescription: 'Écran de remplacement haut de gamme pour réparer l\'affichage de votre iPhone 15 Pro Max. Ce bloc écran complet comprend la dalle LTPO OLED de 6.7 pouces et la vitre tactile. Pour conserver la fonction TrueTone et les capteurs de luminosité ambiante, un transfert de puce ou une programmation logicielle est nécessaire.',
        price: 249.99,
        discountPrice: 229.99,
        demiGrosPrice: 199.99,
        superGrosPrice: 185.00,
        images: ['https://images.unsplash.com/photo-1581091870622-02607f7c8ce4?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // OLED Screens
        brand: brands[0]._id, // Apple
        stock: 9999, // Available
        isFeatured: true,
        variants: [
          { name: 'Qualité', options: ['Original Service Pack', 'Premium OEM'] }
        ],
        specifications: [
          { key: 'Taille', value: '6.7 pouces' },
          { key: 'Résolution', value: '1290 x 2796 pixels' },
          { key: 'Technologie', value: 'Super Retina XDR OLED' }
        ]
      },
      {
        name: 'Écran AMOLED Original Samsung Galaxy S24 Ultra',
        sku: 'S24U-SCR-ORIG',
        description: 'Écran Samsung Service Pack Dynamic AMOLED 2X avec châssis pré-assemblé pour S24 Ultra.',
        longDescription: 'Bloc complet d\'origine constructeur pré-assemblé comprenant la dalle Dynamic AMOLED 2X de 6.8 pouces, la vitre tactile Gorilla Glass Armor, le châssis en titane, la nappe haut-parleur et les joints d\'étanchéité. Prend en charge la fréquence adaptative 120Hz et le capteur d\'empreinte sous l\'écran.',
        price: 299.99,
        discountPrice: 279.99,
        demiGrosPrice: 245.00,
        superGrosPrice: 230.00,
        images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // OLED Screens
        brand: brands[1]._id, // Samsung
        stock: 9999, // Available
        isFeatured: true,
        variants: [
          { name: 'Couleur du Châssis', options: ['Titanium Black', 'Titanium Gray', 'Titanium Yellow'] }
        ],
        specifications: [
          { key: 'Taille', value: '6.8 pouces' },
          { key: 'Résolution', value: '1440 x 3120 pixels' },
          { key: 'Luminosité Max', value: '2600 nits' }
        ]
      },
      {
        name: 'Écran LCD avec Vitre Tactile Xiaomi Redmi Note 12',
        sku: 'RN12-SCR-LCD',
        description: 'Bloc écran complet LCD avec vitre tactile pour Redmi Note 12 4G / 5G.',
        longDescription: 'Écran complet de rechange comprenant l\'afficheur LCD IPS de 6.67 pouces et sa vitre tactile haute sensibilité. Convient parfaitement pour résoudre les problèmes d\'écran noir, de lignes de couleurs ou de tactile défaillant.',
        price: 59.99,
        discountPrice: 49.99,
        demiGrosPrice: 38.00,
        superGrosPrice: 32.00,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // OLED Screens
        brand: brands[2]._id, // Xiaomi
        stock: 9999, // Available
        isFeatured: false,
        variants: [
          { name: 'Couleur', options: ['Noir'] }
        ],
        specifications: [
          { key: 'Taille', value: '6.67 pouces' },
          { key: 'Fréquence', value: '120Hz' }
        ]
      },
      {
        name: 'Écran OLED Original Google Pixel 8 Pro',
        sku: 'GP8P-SCR-OLED',
        description: 'Bloc d\'affichage Super Actua OLED d\'origine constructeur pour Google Pixel 8 Pro.',
        longDescription: 'Module d\'affichage officiel Google comprenant la dalle OLED haute luminosité de 6.7 pouces et sa vitre tactile Corning Gorilla Glass Victus 2. Indispensable pour restaurer la réactivité tactile et le calibrage des couleurs original.',
        price: 219.99,
        demiGrosPrice: 189.99,
        superGrosPrice: 175.00,
        images: ['https://images.unsplash.com/photo-1614680376593-902f74fa0d41?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // OLED Screens
        brand: brands[4]._id, // Google
        stock: 9999,
        isFeatured: true,
        specifications: [
          { key: 'Taille', value: '6.7 pouces' },
          { key: 'Technologie', value: 'Super Actua OLED' }
        ]
      },

      // 2. Batteries
      {
        name: 'Batterie Interne Haute Capacité iPhone 14 Pro',
        sku: 'IP14P-BAT-HC',
        description: 'Batterie interne de remplacement Li-Po 3200mAh avec circuit de contrôle premium.',
        longDescription: 'Remplacez la batterie fatiguée de votre iPhone 14 Pro avec cette batterie certifiée. Comprend un contrôleur de charge de haute qualité protégeant contre la surchauffe et les court-circuits. Affiche l\'état de santé de la batterie dans iOS après programmation.',
        price: 39.99,
        discountPrice: 34.99,
        demiGrosPrice: 22.00,
        superGrosPrice: 18.50,
        images: ['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop'],
        category: categories[1]._id, // Batteries
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Capacité', value: '3200 mAh' },
          { key: 'Tension', value: '3.87 V' }
        ]
      },
      {
        name: 'Batterie Originale Samsung Galaxy S23 Ultra',
        sku: 'S23U-BAT-ORIG',
        description: 'Batterie Lithium-Ion d\'origine Samsung Service Pack de 5000 mAh.',
        longDescription: 'Cellule originale de remplacement sous emballage officiel Samsung. Idéale pour retrouver l\'autonomie d\'origine de votre Galaxy S23 Ultra sans risque de gonflement ou de baisse rapide de charge.',
        price: 44.99,
        demiGrosPrice: 28.00,
        superGrosPrice: 24.00,
        images: ['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop'],
        category: categories[1]._id, // Batteries
        brand: brands[1]._id, // Samsung
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Capacité', value: '5000 mAh' },
          { key: 'Référence', value: 'EB-BS918ABY' }
        ]
      },
      {
        name: 'Batterie de Remplacement Xiaomi Redmi Note 11',
        sku: 'RN11-BAT-OEM',
        description: 'Batterie de remplacement de qualité supérieure pour Redmi Note 11 (5000 mAh).',
        longDescription: 'Batterie Li-Po de grade A+ identique aux dimensions d\'origine pour un ajustement parfait. Livrée avec les adhésifs de pose pour une installation propre et sécurisée.',
        price: 29.99,
        discountPrice: 24.99,
        demiGrosPrice: 16.00,
        superGrosPrice: 13.00,
        images: ['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop'],
        category: categories[1]._id, // Batteries
        brand: brands[2]._id, // Xiaomi
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Capacité', value: '5000 mAh' },
          { key: 'Référence IC', value: 'BN5A' }
        ]
      },

      // 3. Charging Ports
      {
        name: 'Connecteur de Charge USB-C Flex iPhone 13 Pro',
        sku: 'IP13P-CHG-FLEX',
        description: 'Nappe flex connecteur de charge Lightning avec microphone principal et antenne.',
        longDescription: 'Nappe complète comprenant le connecteur de charge, l\'antenne réseau GSM et le microphone principal situé au bas du téléphone. Permet de corriger les pannes de charge et d\'enregistrement vocal.',
        price: 24.99,
        demiGrosPrice: 14.50,
        superGrosPrice: 11.00,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=800&auto=format&fit=crop'],
        category: categories[2]._id, // Charging Ports
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        variants: [
          { name: 'Couleur', options: ['Gris Sidéral', 'Argent', 'Or', 'Bleu Sierra'] }
        ],
        specifications: [
          { key: 'Type', value: 'Lightning Port Flex' }
        ]
      },
      {
        name: 'Connecteur de Charge USB-C Board Galaxy S22 Ultra',
        sku: 'S22U-CHG-BOARD',
        description: 'Sous-carte électronique de charge d\'origine Samsung pour Galaxy S22 Ultra.',
        longDescription: 'Circuit imprimé inférieur officiel Samsung comprenant le port USB-C femelle de rechange. Répare la charge rapide Fast Charge et le transfert de données OTG.',
        price: 29.99,
        discountPrice: 22.99,
        demiGrosPrice: 16.00,
        superGrosPrice: 12.50,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=800&auto=format&fit=crop'],
        category: categories[2]._id, // Charging Ports
        brand: brands[1]._id, // Samsung
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Type de Connecteur', value: 'USB Type-C 3.2' },
          { key: 'Compatibilité', value: 'SM-S908B' }
        ]
      },

      // 4. Motherboard ICs
      {
        name: 'Puce IC de Gestion d\'Énergie PMIC iPhone 14 Pro',
        sku: 'IP14-PMIC-343S',
        description: 'Micro-puce IC de gestion d\'alimentation principale pour carte mère iPhone 14 Pro.',
        longDescription: 'Circuit intégré soudable hautement complexe pour réparateurs en micro-soudure. Répare les problèmes de court-circuit, les pannes de démarrage ou les surchauffes système.',
        price: 34.99,
        demiGrosPrice: 24.00,
        superGrosPrice: 19.90,
        images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop'],
        category: categories[3]._id, // IC Chips
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Boîtier', value: 'BGA Chip' },
          { key: 'Usage', value: 'Power Management Unit (PMU)' }
        ]
      },
      {
        name: 'Circuit Intégré Codec Audio iPhone 12 Pro Max',
        sku: 'IP12-AUDIO-IC',
        description: 'Puce audio IC soudable pour réparer les coupures de micro et de haut-parleur.',
        longDescription: 'Puce de contrôle audio originale pour micro-soudure sur carte mère. Corrige le problème classique de grésillement, de boutons de volume grisés ou de microphone inopérant pendant les appels.',
        price: 19.99,
        demiGrosPrice: 12.00,
        superGrosPrice: 9.50,
        images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop'],
        category: categories[3]._id, // IC Chips
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Type', value: 'Soudure SMD' }
        ]
      },
      {
        name: 'Puce IC Réseau Transceiver Huawei Mate 40 Pro',
        sku: 'HW40-RF-TRANS',
        description: 'Puce de réception radiofréquence 5G/LTE pour cartes mères Huawei.',
        longDescription: 'Puce RF Transceiver de rechange pour les problèmes de déconnexion réseau, perte de signal 4G/5G, ou message d\'erreur "Aucun Service" sur les cartes mères endommagées.',
        price: 27.99,
        demiGrosPrice: 18.00,
        superGrosPrice: 14.00,
        images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop'],
        category: categories[3]._id, // IC Chips
        brand: brands[5]._id, // Huawei
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Fréquences', value: 'GSM / WCDMA / LTE / 5G' }
        ]
      },

      // 5. Accessories & Extra modules
      {
        name: 'Verre Trempé 9D Intégral Antichoc iPhone 15 Pro',
        sku: 'IP15P-GLASS-9D',
        description: 'Protection d\'écran en verre trempé double dureté 9D avec bords incurvés noirs.',
        longDescription: 'Film de protection en verre trempé ultra-résistant de dureté 9H, avec technologie anti-poussière intégrée. Protège l\'écran contre les chocs violents et les rayures sans altérer la sensibilité tactile.',
        price: 9.99,
        discountPrice: 7.99,
        demiGrosPrice: 3.50,
        superGrosPrice: 2.20,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop'],
        category: categories[4]._id, // Accessories
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Épaisseur', value: '0.33 mm' },
          { key: 'Dureté', value: '9H standard de laboratoire' }
        ]
      },
      {
        name: 'Chargeur Secteur Rapide SuperVOOC OnePlus 80W',
        sku: 'OP-CHG-80W',
        description: 'Adaptateur secteur de charge ultra-rapide original OnePlus SuperVOOC USB-A.',
        longDescription: 'Prise de charge d\'origine OnePlus délivrant jusqu\'à 80W de puissance de charge. Recharge la batterie de votre OnePlus 11 de 0 à 100% en moins de 35 minutes de manière sécurisée.',
        price: 49.99,
        demiGrosPrice: 32.00,
        superGrosPrice: 27.50,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop'],
        category: categories[4]._id, // Accessories
        brand: brands[3]._id, // OnePlus
        stock: 9999,
        isFeatured: true,
        specifications: [
          { key: 'Puissance', value: '80 Watts' },
          { key: 'Norme', value: 'SuperVOOC / Warp Charge' }
        ]
      },
      {
        name: 'Module Triple Caméra Arrière iPhone 13 Pro Max',
        sku: 'IP13PM-CAM-ORIG',
        description: 'Module complet triple capteur photo d\'origine Apple Service Pack.',
        longDescription: 'Bloc optique triple caméra original comprenant le capteur grand-angle de 12 Mpx, l\'ultra grand-angle, le téléobjectif et les moteurs de stabilisation optique de l\'image (Sensor-shift OIS). Répare les caméras arrières floues ou vibrantes.',
        price: 159.99,
        discountPrice: 149.99,
        demiGrosPrice: 125.00,
        superGrosPrice: 115.00,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // OLED Screens (or custom category)
        brand: brands[0]._id, // Apple
        stock: 0, // Rupture de Stock
        isFeatured: false,
        specifications: [
          { key: 'Capteur Principal', value: '12 Mégapixels' },
          { key: 'Stabilisation', value: 'Optique (Sensor-Shift)' }
        ]
      },
      {
        name: 'Écran OLED Original Xiaomi 13 Pro',
        sku: 'XI13P-SCR-OLED',
        description: 'Écran AMOLED incurvé original Service Pack de remplacement pour Xiaomi 13 Pro.',
        longDescription: 'Écran AMOLED 120Hz LTPO d\'origine constructeur pour Xiaomi 13 Pro. Comprend la dalle en verre tactile et le capteur d\'empreintes sous l\'écran. Offre des couleurs éclatantes et une fluidité tactile parfaite.',
        price: 189.99,
        demiGrosPrice: 145.00,
        superGrosPrice: 130.00,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // Écrans OLED & LCD
        brand: brands[2]._id, // Xiaomi
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Taille', value: '6.73 pouces' },
          { key: 'Résolution', value: '1440 x 3200 pixels' },
          { key: 'Technologie', value: 'LTPO AMOLED 120Hz' }
        ]
      },
      {
        name: 'Écran AMOLED Oppo Find X5 Pro',
        sku: 'OPX5P-SCR-AMOLED',
        description: 'Dalle d\'affichage AMOLED LTPO flexible d\'origine avec vitre tactile pour Find X5 Pro.',
        longDescription: 'Module d\'affichage complet original avec vitre tactile incurvée pour Oppo Find X5 Pro. Résolution QHD+ et taux de rafraîchissement adaptatif 120Hz.',
        price: 199.99,
        demiGrosPrice: 160.00,
        superGrosPrice: 145.00,
        images: ['https://images.unsplash.com/photo-1581091870622-02607f7c8ce4?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // Écrans OLED & LCD
        brand: brands[6]._id, // Oppo
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Technologie', value: 'AMOLED QHD+' },
          { key: 'Taille', value: '6.7 pouces' }
        ]
      },
      {
        name: 'Écran LCD avec Tactile Sony Xperia 10 V',
        sku: 'SNX105-SCR-LCD',
        description: 'Afficheur LCD Triluminos original Sony avec vitre tactile pour Xperia 10 V.',
        longDescription: 'Épant complet officiel de remplacement pour réparer les écrans fissurés ou sans affichage sur Sony Xperia 10 V. Résolution nette et couleurs équilibrées.',
        price: 79.99,
        demiGrosPrice: 60.00,
        superGrosPrice: 50.00,
        images: ['https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // Écrans OLED & LCD
        brand: brands[7]._id, // Sony
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Format', value: '21:9' },
          { key: 'Taille', value: '6.1 pouces' }
        ]
      },
      {
        name: 'Batterie Interne Google Pixel 7 Pro',
        sku: 'GP7P-BAT-ORIG',
        description: 'Batterie originale Li-ion Service Pack Google de 5000 mAh.',
        longDescription: 'Batterie officielle de remplacement pour Google Pixel 7 Pro. Capacité de 5000 mAh garantissant une autonomie optimale.',
        price: 39.99,
        demiGrosPrice: 24.00,
        superGrosPrice: 20.00,
        images: ['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop'],
        category: categories[1]._id, // Batteries Li-ion
        brand: brands[4]._id, // Google
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Capacité', value: '5000 mAh' },
          { key: 'Référence', value: 'G282A' }
        ]
      },
      {
        name: 'Batterie Originale OnePlus 10 Pro',
        sku: 'OP10P-BAT-ORIG',
        description: 'Batterie Li-Po double cellule d\'origine OnePlus de 5000 mAh.',
        longDescription: 'Batterie interne d\'origine pour OnePlus 10 Pro. Supporte la charge rapide SuperVOOC 80W en toute sécurité.',
        price: 42.99,
        demiGrosPrice: 26.00,
        superGrosPrice: 22.00,
        images: ['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop'],
        category: categories[1]._id, // Batteries Li-ion
        brand: brands[3]._id, // OnePlus
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Capacité', value: '5000 mAh (2x2500mAh)' },
          { key: 'Compatibilité', value: 'NE2210 / NE2213' }
        ]
      },
      {
        name: 'Batterie de Remplacement Huawei P30 Pro',
        sku: 'HWP30P-BAT-OEM',
        description: 'Batterie Lithium-Polymer de remplacement Premium pour P30 Pro (4200 mAh).',
        longDescription: 'Batterie Li-Po haute qualité avec puce de sécurité intégrée contre la surcharge pour Huawei P30 Pro.',
        price: 29.99,
        demiGrosPrice: 18.00,
        superGrosPrice: 15.00,
        images: ['https://images.unsplash.com/photo-1620288627223-53302f4e8c74?w=800&auto=format&fit=crop'],
        category: categories[1]._id, // Batteries Li-ion
        brand: brands[5]._id, // Huawei
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Capacité', value: '4200 mAh' },
          { key: 'Référence IC', value: 'HB486486ECW' }
        ]
      },
      {
        name: 'Connecteur de Charge Flex iPhone 12 / 12 Pro',
        sku: 'IP12-CHG-FLEX',
        description: 'Nappe de charge avec port Lightning, micro principal et antenne pour iPhone 12 / 12 Pro.',
        longDescription: 'Nappe flexible complète comprenant le connecteur de charge Lightning officiel et les micros bas de rechange pour iPhone 12 et iPhone 12 Pro.',
        price: 22.99,
        demiGrosPrice: 12.50,
        superGrosPrice: 10.00,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=800&auto=format&fit=crop'],
        category: categories[2]._id, // Connecteurs & Ports de Charge
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Type', value: 'Lightning Port Flex' },
          { key: 'Compatibilité', value: 'A2172 / A2403' }
        ]
      },
      {
        name: 'Connecteur de Charge USB-C Board Samsung A53',
        sku: 'SMA536-CHG-BOARD',
        description: 'Sous-carte électronique de charge d\'origine Samsung pour Galaxy A53 5G.',
        longDescription: 'Circuit de charge complet officiel avec connecteur USB-C, lecteur de carte SIM et broches de contact pour Galaxy A53 5G.',
        price: 18.99,
        demiGrosPrice: 11.00,
        superGrosPrice: 9.00,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=800&auto=format&fit=crop'],
        category: categories[2]._id, // Connecteurs & Ports de Charge
        brand: brands[1]._id, // Samsung
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Type de Port', value: 'USB-C' },
          { key: 'Modèle', value: 'SM-A536B' }
        ]
      },
      {
        name: 'Connecteur de Charge Board Xiaomi Redmi Note 10',
        sku: 'RN10-CHG-BOARD',
        description: 'Carte de charge USB Type-C originale pour Redmi Note 10 4G.',
        longDescription: 'Circuit imprimé inférieur de rechange comprenant le port de charge USB-C, la prise jack audio et la prise antenne réseau pour Redmi Note 10 4G.',
        price: 15.99,
        demiGrosPrice: 9.00,
        superGrosPrice: 7.50,
        images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59edd6?w=800&auto=format&fit=crop'],
        category: categories[2]._id, // Connecteurs & Ports de Charge
        brand: brands[2]._id, // Xiaomi
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Connectique', value: 'USB Type-C' }
        ]
      },
      {
        name: 'Puce IC U2 Tristar USB Charging iPhone 11/11 Pro',
        sku: 'IP11-U2-IC',
        description: 'Puce de contrôle de charge USB U2 Tristar (1612A1) pour carte mère iPhone 11.',
        longDescription: 'Micro-puce IC de gestion de charge Tristar à souder sur la carte mère d\'iPhone 11, 11 Pro ou 11 Pro Max pour réparer la panne "fausse charge".',
        price: 12.99,
        demiGrosPrice: 7.00,
        superGrosPrice: 5.50,
        images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop'],
        category: categories[3]._id, // Composants Soudables & IC
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Boîtier', value: 'BGA-36' },
          { key: 'Référence', value: '1612A1' }
        ]
      },
      {
        name: 'Puce IC Baseband PMIC Qualcomm PM8150',
        sku: 'QC-PM8150-IC',
        description: 'Puce IC principale de gestion d\'alimentation Qualcomm PM8150 pour smartphones Android.',
        longDescription: 'Puce d\'alimentation intégrée PMIC de rechange pour les téléphones Android de haut niveau (Google Pixel, OnePlus). Résout les courts-circuits généraux.',
        price: 24.99,
        demiGrosPrice: 15.00,
        superGrosPrice: 12.00,
        images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop'],
        category: categories[3]._id, // Composants Soudables & IC
        brand: brands[4]._id, // Google
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Technologie', value: 'Qualcomm Snapdragon PMIC' }
        ]
      },
      {
        name: 'Verre Trempé Intégral Antichoc Samsung Galaxy S23 Ultra',
        sku: 'S23U-GLASS-9D',
        description: 'Protection d\'écran en verre trempé incurvé 3D avec adhésif UV intégral.',
        longDescription: 'Verre de protection incurvé avec gel adhésif liquide UV pour une adhérence parfaite sur les bords incurvés de l\'écran du Galaxy S23 Ultra.',
        price: 12.99,
        demiGrosPrice: 5.00,
        superGrosPrice: 3.50,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop'],
        category: categories[4]._id, // Accessoires de Protection
        brand: brands[1]._id, // Samsung
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Type', value: 'Verre Incurvé UV' },
          { key: 'Dureté', value: '9H' }
        ]
      },
      {
        name: 'Vitre en Verre Arrière de Remplacement iPhone 14',
        sku: 'IP14-BACK-GLASS',
        description: 'Vitre arrière en verre de rechange avec grand trou d\'appareil photo pour iPhone 14.',
        longDescription: 'Vitre arrière en verre trempé de qualité d\'origine avec ouverture élargie pour l\'appareil photo pour faciliter l\'installation sans démonter le module photo.',
        price: 34.99,
        demiGrosPrice: 20.00,
        superGrosPrice: 16.00,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop'],
        category: categories[4]._id, // Accessoires de Protection
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Matériau', value: 'Verre trempé' },
          { key: 'Couleur', value: 'Midnight Black' }
        ]
      },
      {
        name: 'Coque Antichoc Transparente Grade Militaire iPhone 15',
        sku: 'IP15-CASE-SHOCK',
        description: 'Coque de protection transparente avec coins renforcés Air-Cushion pour iPhone 15.',
        longDescription: 'Coque hybride combinant un dos en polycarbonate rigide et des contours en TPU souple. Protection certifiée contre les chutes de 2 mètres.',
        price: 19.99,
        demiGrosPrice: 8.00,
        superGrosPrice: 5.50,
        images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop'],
        category: categories[4]._id, // Accessoires de Protection
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Protection', value: 'Chocs Grade Militaire' },
          { key: 'Couleur', value: 'Transparente anti-jaunissement' }
        ]
      },
      {
        name: 'Module Caméra Frontale Original iPhone 13',
        sku: 'IP13-FCAM-ORIG',
        description: 'Module complet caméra avant et capteur FaceID d\'origine Apple Service Pack.',
        longDescription: 'Module de caméra frontale de rechange d\'origine pour iPhone 13. Répare l\'appareil photo flou et les dysfonctionnements FaceID (nécessite une reprogrammation pour activer Face ID).',
        price: 49.99,
        demiGrosPrice: 32.00,
        superGrosPrice: 28.00,
        images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop'],
        category: categories[0]._id, // Écrans OLED & LCD
        brand: brands[0]._id, // Apple
        stock: 9999,
        isFeatured: false,
        specifications: [
          { key: 'Résolution', value: '12 Mégapixels' },
          { key: 'Ouverture', value: 'f/2.2' }
        ]
      }
    ]);

    console.log('Products seeded...');

    // Seed Coupons
    await Coupon.create([
      {
        code: 'NORDINE10',
        discountType: 'percentage',
        discountValue: 10,
        minPurchaseAmount: 50,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
      },
      {
        code: 'PROMOFIX30',
        discountType: 'fixed',
        discountValue: 30,
        minPurchaseAmount: 150,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    ]);

    console.log('Coupons seeded...');

    // Seed Notification alerts
    await Notification.create([
      {
        title: 'Bienvenue sur le Tableau de bord Admin NordineStore',
        message: 'L\'ensemble de l\'inventaire et des flux de facturation pour techniciens ont été mis en service.',
        type: 'info'
      }
    ]);

    console.log('Database seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Seeding error: ${error}`);
    process.exit(1);
  }
};

connectDB().then(importData);
