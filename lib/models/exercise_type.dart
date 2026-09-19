enum ExerciseType {
  listening,
  blending;

  String get title => switch (this) {
        ExerciseType.listening => 'Nghe & nhận diện',
        ExerciseType.blending => 'Ghép âm',
      };

  String get sectionLabel => switch (this) {
        ExerciseType.listening => 'Phần 1',
        ExerciseType.blending => 'Phần 2',
      };
}
