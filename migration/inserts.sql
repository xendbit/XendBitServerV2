INSERT INTO `XB_GL` VALUES (47,'payment.method','{\"text\":\"Naira Token\",\"value\":\"Naira\",\"enable\":1,\"charge\":\"100 Naira\"}',100),(48,'id.type','{\"text\":\"International Passport\",\"value\":1}',200),(49,'id.type','{\"text\":\"Driver\'s Licence\",\"value\":2}',200),(50,'id.type','{\"text\":\"National ID Card\",\"value\":3}',200),(51,'bank','{\"bankCode\":\"070\",\"bankName\":\"FIDELITY BANK PLC\"}',300),(52,'bank','{\"bankCode\":\"050\",\"bankName\":\"ECOBANK NIGERIA PLC\"}',300),(53,'bank','{\"bankCode\":\"030\",\"bankName\":\"HERITAGE BANK\"}',300),(54,'bank','{\"bankCode\":\"076\",\"bankName\":\"SKYE BANK PLC\"}',300),(55,'bank','{\"bankCode\":\"032\",\"bankName\":\"UNION BANK OF NIGERIA PLC\"}',300),(56,'bank','{\"bankCode\":\"011\",\"bankName\":\"FIRST BANK PLC\"}',300),(57,'bank','{\"bankCode\":\"033\",\"bankName\":\"UNITED BANK FOR AFRICA PLC\"}',300),(58,'bank','{\"bankCode\":\"232\",\"bankName\":\"STERLING BANK PLC\"}',300),(59,'bank','{\"bankCode\":\"035\",\"bankName\":\"WEMA BANK PLC\"}',300),(60,'bank','{\"bankCode\":\"057\",\"bankName\":\"ZENITH BANK PLC\"}',300),(61,'bank','{\"bankCode\":\"311\",\"bankName\":\"Parkway\"}',300),(62,'bank','{\"bankCode\":\"014\",\"bankName\":\"AFRIBANK NIGERIA PLC\"}',300),(63,'bank','{\"bankCode\":\"058\",\"bankName\":\"GTBANK PLC\"}',300),(64,'bank','{\"bankCode\":\"214\",\"bankName\":\"FIRST CITY MONUMENT BANK PLC\"}',300),(65,'bank','{\"bankCode\":\"215\",\"bankName\":\"UNITY BANK PLC\"}',300),(66,'bank','{\"bankCode\":\"315\",\"bankName\":\"GTBank Mobile Money\"}',300),(67,'bank','{\"bankCode\":\"082\",\"bankName\":\"KEYSTONE BANK PLC\"}',300),(68,'bank','{\"bankCode\":\"084\",\"bankName\":\"ENTERPRISE BANK LIMITED\"}',300),(69,'bank','{\"bankCode\":\"063\",\"bankName\":\"DIAMOND BANK PLC\"}',300),(70,'bank','{\"bankCode\":\"044\",\"bankName\":\"ACCESS BANK NIGERIA\"}',300),(71,'bank','{\"bankCode\":\"221\",\"bankName\":\"STANBIC IBTC BANK PLC\"}',300),(72,'bank','{\"bankCode\":\"068\",\"bankName\":\"STANDARD CHARTERED BANK NIGERIA LIMITED\"}',300),(73,'bank','{\"bankCode\":\"322\",\"bankName\":\"ZENITH Mobile\"}',300),(74,'bank','{\"bankCode\":\"323\",\"bankName\":\"ACCESS MOBILE\"}',300),(75,'bank','{\"bankCode\":\"401\",\"bankName\":\"Aso Savings and Loans\"}',300),(76,'bank','{\"bankCode\":\"304\",\"bankName\":\"Stanbic Mobile\"}',300),(77,'bank','{\"bankCode\":\"305\",\"bankName\":\"PAYCOM\"}',300),(78,'bank','{\"bankCode\":\"307\",\"bankName\":\"Ecobank Mobile\"}',300),(79,'bank','{\"bankCode\":\"309\",\"bankName\":\"FBN MOBILE\"}',300);

UPDATE XB_ADDRESS_MAPPING SET 
    MIN_XEND_FEES = 5.0, 
    MIN_BLOCK_FEES = 0.00005,
    EXTERNAL_DEPOSIT_FEES = 300,
    PERC_EXTERNAL_TRADING_FEES = 0.001,
    MAX_XEND_FEES = 100.0,
    PERC_XEND_FEES = 0.005,
    EXTERNAL_WITHDRAWAL_FEES = 0.0005
WHERE CHAIN = 'BTC';

UPDATE XB_ADDRESS_MAPPING SET 
    MIN_XEND_FEES = 3.0, 
    MIN_BLOCK_FEES = 0.00005,
    EXTERNAL_DEPOSIT_FEES = 300,
    PERC_EXTERNAL_TRADING_FEES = 0.001,
    MAX_XEND_FEES = 100.0,
    PERC_XEND_FEES = 0.005,
    EXTERNAL_WITHDRAWAL_FEES = 0.005
WHERE CHAIN = 'ETH';