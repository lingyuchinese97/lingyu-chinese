import 'package:flutter/material.dart';

import 'core/theme.dart';
import 'screens/bai1_home_screen.dart';

void main() {
  runApp(const LingYuChineseApp());
}

class LingYuChineseApp extends StatelessWidget {
  const LingYuChineseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LingYu Chinese',
      debugShowCheckedModeBanner: false,
      theme: LingYuTheme.light(),
      home: const Bai1HomeScreen(),
    );
  }
}
