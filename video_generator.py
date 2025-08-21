from gtts import gTTS
from moviepy import *

def text_to_audio(text, output_audio_path):
    tts = gTTS(text=text, lang='fr')
    tts.save(output_audio_path)

def generate_ultimate_video(chapter_title, chapter_text, quiz_list, output_video_path, background_image=None, logo_path=None):
    # 1️⃣ Générer l'audio
    full_text = chapter_text + "\n\n" + "\n".join([q['question'] + " " + ", ".join(q['options']) for q in quiz_list])
    audio_path = "temp_audio.mp3"
    text_to_audio(full_text, audio_path)
    audio_clip = AudioFileClip(audio_path)
    
    # 2️⃣ Fond
    if background_image:
        base_clip = ImageClip(background_image).with_duration(audio_clip.duration)
    else:
        base_clip = ColorClip(size=(1280, 720), color=(255, 255, 255), duration=audio_clip.duration)
    
    clips = [base_clip]

    # 3️⃣ Logo
    if logo_path:
        logo_clip = (ImageClip(logo_path)
                     .with_duration(audio_clip.duration)
                     .resized(height=80)
                     .with_position(("right", "top")))
        clips.append(logo_clip)

    # 4️⃣ Titre du chapitre
    title_clip = (TextClip(font='Arial',text= chapter_title, color='black')
                  .with_fontsize(60)
                  .with_position(('center', 50))
                  .with_duration(audio_clip.duration))
    

    clips.append(title_clip)

    # 5️⃣ Texte avec surlignage dynamique
    lines = chapter_text.split('\n')
    y_start = 150
    total_lines = len(lines)
    line_duration = audio_clip.duration / max(total_lines + len(quiz_list), 1)  # répartir l'audio
    
    for i, line in enumerate(lines):
        # texte normal
        normal_clip = (TextClip(line, color='black', size=(1100, 50), method='caption')
                       .with_fontsize(40)
                       .with_position(('center', y_start + i*50))
                       .with_duration(audio_clip.duration))
        clips.append(normal_clip)
        
        # surlignage
        highlight_clip = (TextClip(line, color='white', size=(1100, 50), method='caption', bg_color='orange')
                          .with_fontsize(40)
                          .with_position(('center', y_start + i*50))
                          .set_start(i*line_duration)
                          .with_duration(line_duration))
        clips.append(highlight_clip)

    # 6️⃣ Quiz animé question par question
    y_quiz_start = y_start + total_lines*50 + 50
    for j, q in enumerate(quiz_list):
        quiz_str = q['question'] + "\n" + "\n".join([f"- {opt}" for opt in q['options']])
        quiz_clip = (TextClip(quiz_str, color='darkblue', size=(1100, 400), method='caption')
                     .with_fontsize(35)
                     .with_position(('center', y_quiz_start))
                     .set_start((total_lines+j)*line_duration)
                     .with_duration(line_duration*2)
                     .fadein(0.5))
        clips.append(quiz_clip)
        y_quiz_start += 200
from gtts import gTTS
from moviepy import *
from moviepy.video.fx.FadeIn import FadeIn


def text_to_audio(text, output_audio_path):
    """Convertit un texte en fichier audio (voix française)."""
    tts = gTTS(text=text, lang='fr')
    tts.save(output_audio_path)


def generate_dynamic_video(chapter_title, chapter_text, quiz_list, audio_path, output_video_path, background_image=None, logo_path=None):
    # 1️⃣ Générer l'audio du texte + quiz
    full_text = chapter_text + "\n\n" + "\n".join(
        [q['question'] + " " + ", ".join(q['options']) for q in quiz_list]
    )
    text_to_audio(full_text, audio_path)
    audio_clip = AudioFileClip(audio_path)

    # 2️⃣ Fond (image ou couleur unie)
    if background_image:
        video_clip = ImageClip(background_image).with_duration(audio_clip.duration)
    else:
        video_clip = ColorClip(size=(1280, 720), color=(255, 255, 255), duration=audio_clip.duration)

    clips = [video_clip]

    # 3️⃣ Logo (si fourni)
    if logo_path:
        logo_clip = (
            ImageClip(logo_path)
            .with_duration(audio_clip.duration)
            .resized(height=80)
            .with_position(("right", "top"))
        )
        clips.append(logo_clip)

    # 4️⃣ Titre du chapitre avec effet FadeIn
    title_clip = (
        TextClip(text=chapter_title, font=None, font_size=60, color='black', size=(1100, None), method='caption')
        .with_position(('center', 50))
        .with_duration(audio_clip.duration)
    )
    title_clip = FadeIn(duration=0.8).apply(title_clip)
    clips.append(title_clip)

    # 5️⃣ Texte dynamique ligne par ligne
    lines = chapter_text.split('\n')
    y_start = 150
    line_duration = audio_clip.duration / max(len(lines) + len(quiz_list), 1)

    for i, line in enumerate(lines):
        txt_clip = (
            TextClip(text=line, font=None, font_size=40, color='black', size=(1100, 100), method='caption')
            .with_position(('center', y_start + i * 50))
            .with_duration(line_duration * 2)
        )
        txt_clip = FadeIn(duration=0.6).copy().apply(txt_clip)
        clips.append(txt_clip)

    # 6️⃣ Quiz animé
    y_pos = y_start + len(lines) * 50 + 50
    for q in quiz_list:
        quiz_str = q['question'] + "\n" + "\n".join([f"- {opt}" for opt in q['options']])
        quiz_clip = (
            TextClip(text=quiz_str, font=None, font_size=35, color='darkblue', size=(1100, 400), method='caption')
            .with_position(('center', y_pos))
            .with_duration(line_duration * 3)
        )
        quiz_clip = FadeIn(duration=0.6).copy().apply(quiz_clip)
        clips.append(quiz_clip)
        y_pos += 200

    # 7️⃣ Combinaison et ajout audio
    final_clip = CompositeVideoClip(clips).with_audio(audio_clip)

    # 8️⃣ Export final
    final_clip.write_videofile(output_video_path, fps=24)


# Exemple d'utilisation
if __name__ == "__main__":
    chapter_title = "Les Bases du Python"
    chapter_text = (
        "Python est un langage de programmation simple et puissant.\n"
        "Il est utilisé pour le développement web, la data science, et bien plus."
    )
    quiz_list = [
        {"question": "Quelle est la syntaxe pour afficher du texte ?", "options": ["print()", "echo()", "console.log()"]},
        {"question": "Python est-il typé dynamiquement ?", "options": ["Oui", "Non"]}
    ]
    audio_path = "chapter_audio.mp3"
    video_path = "chapter_video.mp4"
    background_image = "static/background.png"
    logo_path = "static/logo.png"

    generate_dynamic_video(chapter_title, chapter_text, quiz_list, audio_path, video_path, background_image, logo_path)

    # 7️⃣ Combiner tous les clips
    final_clip = CompositeVideoClip(clips)
    final_clip = final_clip.set_audio(audio_clip)

    # 8️⃣ Export
    final_clip.write_videofile(output_video_path, fps=24)

