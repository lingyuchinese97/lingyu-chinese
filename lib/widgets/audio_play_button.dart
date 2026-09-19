import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';

import '../core/theme.dart';

/// Nút nghe audio dạng vòng tròn lớn (ripple bg + circle gradient xanh),
/// khớp UI thật. Không giới hạn số lần nghe lại (UI thật không có badge
/// đếm lượt nghe như bản nháp trước).
class AudioPlayButton extends StatefulWidget {
  const AudioPlayButton({super.key, required this.audioAsset});

  final String? audioAsset;

  @override
  State<AudioPlayButton> createState() => AudioPlayButtonState();
}

class AudioPlayButtonState extends State<AudioPlayButton> {
  final _player = AudioPlayer();
  bool _isPlaying = false;

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  /// Cho phép màn cha (nút "Nghe lại") gọi lại phát audio.
  void play() => _play();

  Future<void> _play() async {
    final asset = widget.audioAsset;
    if (asset == null || _isPlaying) return;
    setState(() => _isPlaying = true);
    try {
      final relativePath = asset.startsWith('assets/') ? asset.substring('assets/'.length) : asset;
      await _player.play(AssetSource(relativePath));
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Chưa có file audio cho câu này.'), duration: Duration(seconds: 2)),
        );
      }
    } finally {
      if (mounted) setState(() => _isPlaying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 88,
      height: 88,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(colors: [LingYuColors.blueLight, Color(0xFFD6EAFE)]),
      ),
      child: Center(
        child: GestureDetector(
          onTap: _play,
          child: Container(
            width: 66,
            height: 66,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF3D9BFF), LingYuColors.blue],
              ),
              boxShadow: [BoxShadow(color: Color(0x4D0B5FEE), blurRadius: 14, offset: Offset(0, 6))],
            ),
            child: Center(
              child: _isPlaying
                  ? const SizedBox(
                      width: 26,
                      height: 26,
                      child: CircularProgressIndicator(strokeWidth: 2.5, valueColor: AlwaysStoppedAnimation(Colors.white)),
                    )
                  : const Icon(Icons.headphones_rounded, color: Colors.white, size: 30),
            ),
          ),
        ),
      ),
    );
  }
}
