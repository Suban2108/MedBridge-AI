import sounddevice as sd
import scipy.io.wavfile as wav
import numpy as np
import whisper
import os
import sys

# Load the Whisper model (base model for speed, can change to 'small', 'medium', 'large' for better accuracy)
MODEL = whisper.load_model("small")

def record_audio(duration=10, sample_rate=32000, filename="recording.wav"):
    """
    Records audio from the microphone for a specified duration and saves it as a .wav file.
    
    Args:
        duration (int): Recording duration in seconds (default: 10)
        sample_rate (int): Sample rate for recording (default: 32000, Whisper's expected rate)
        filename (str): Output filename for the .wav file
    
    Returns:
        str: Path to the saved .wav file, or None if recording failed
    """
    try:
        print(f"Recording for {duration} seconds... Speak now!")
        
        # Record audio
        audio = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
        sd.wait()  # Wait for recording to finish
        
        # Normalize audio to prevent clipping
        audio = np.squeeze(audio)
        audio = audio / np.max(np.abs(audio)) if np.max(np.abs(audio)) > 0 else audio
        
        # Save as .wav file
        wav.write(filename, sample_rate, (audio * 32767).astype(np.int16))
        print(f"Recording saved as {filename}")
        return filename
    
    except Exception as e:
        print(f"Error recording audio: {e}")
        return None

def transcribe_audio(audio_file, task="transcribe"):
    """
    Transcribes audio using Whisper and detects the language.
    
    Args:
        audio_file (str): Path to the .wav file
        task (str): "transcribe" for transcription, "translate" for translation to English
    
    Returns:
        dict: Contains 'text' (transcribed/translated text) and 'language' (detected language)
              or None if transcription failed
    """
    try:
        if not os.path.exists(audio_file):
            print(f"Audio file {audio_file} not found.")
            return None
        
        # Load and process audio
        audio = whisper.load_audio(audio_file)
        audio = whisper.pad_or_trim(audio)
        
        # Create mel spectrogram
        mel = whisper.log_mel_spectrogram(audio).to(MODEL.device)
        
        # Detect language (only for transcribe task)
        if task == "transcribe":
            _, probs = MODEL.detect_language(mel)
            detected_lang = max(probs, key=probs.get)
        else:
            detected_lang = "en"  # Translation always outputs English
        
        # Decode audio
        options = whisper.DecodingOptions(task=task, language=None if task == "translate" else detected_lang)
        result = whisper.decode(MODEL, mel, options)
        
        return {
            "text": result.text.strip(),
            "language": detected_lang
        }
    
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        return None

def main():
    """
    Main function with CLI menu for recording and transcribing/translation.
    """
    print("=== Multilingual Voice Input with Whisper ===")
    print("This tool records audio, transcribes it, and optionally translates to English.")
    print()
    
    while True:
        print("Menu:")
        print("1. Record and transcribe (detect language)")
        print("2. Record and translate to English")
        print("3. Exit")
        
        choice = input("Choose an option (1-3): ").strip()
        
        if choice == "3":
            print("Goodbye!")
            break
        
        if choice not in ["1", "2"]:
            print("Invalid choice. Please try again.\n")
            continue
        
        # Record audio
        audio_file = record_audio()
        if not audio_file:
            print("Recording failed. Please try again.\n")
            continue
        
        # Transcribe or translate
        task = "transcribe" if choice == "1" else "translate"
        result = transcribe_audio(audio_file, task=task)
        
        if result:
            print(f"\nTranscribed Text: {result['text']}")
            print(f"Detected Language: {result['language']}")
        else:
            print("Transcription failed. Please try again.")
        
        # Clean up audio file
        try:
            os.remove(audio_file)
        except:
            pass
        
        print("\n" + "="*50 + "\n")

if __name__ == "__main__":
    main()