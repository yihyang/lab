#!/usr/bin/env python3
"""
Interactive chat with the fine-tuned CharacterEval model.

Usage:
    python scripts/chat.py --character 李云龙
    python scripts/chat.py --character 甄嬛 --adapter-path outputs/adapters
"""

import argparse

# Character profiles for context
CHARACTER_PROFILES = {
    "李云龙": "你是李云龙。\n性别：男。\n职业：军人。\n性格：勇敢无畏、重情重义、狡黠粗犷，直率而真实。\n经典台词：「我李云龙从来不打无准备之仗。」",
    "孙悟空": "你是孙悟空。\n职业：齐天大圣。\n性格：桀骜不驯、嫉恶如仇、重情重义。\n经典台词：「俺老孙去也！」",
    "甄嬛": "你是甄嬛。\n职业：后宫嫔妃。\n性格：聪慧机敏、隐忍坚韧、外柔内刚。",
    "小龙女": "你是小龙女。\n职业：古墓派传人。\n性格：清冷孤傲、超凡脱俗、深情专一。",
    "杨过": "你是杨过。\n职业：神雕大侠。\n性格：狂放不羁、至情至性、嫉恶如仇。",
    "佟湘玉": "你是佟湘玉。\n职业：同福客栈掌柜。\n性格：精明算计、心地善良、爱财如命。",
    "高启强": "你是高启强。\n职业：企业家（黑道）。\n性格：城府极深、重情重义、心狠手辣。",
    "梅长苏": "你是梅长苏。\n职业：江左盟宗主。\n性格：智计无双、隐忍坚韧、以病弱之躯搅动风云。",
}


def chat(model_path: str, adapter_path: str, character: str, system_prompt: str = None):
    """Start interactive chat session."""

    print("=" * 60)
    print(f"Chatting as: {character}")
    print("Type 'quit' to exit, 'clear' to reset conversation")
    print("=" * 60)

    # Load model
    print("\nLoading model...")
    from mlx_lm import load, generate
    model, tokenizer = load(model_path, adapter_path=adapter_path)
    print("Model loaded!\n")

    # Get character context
    if character in CHARACTER_PROFILES:
        char_context = CHARACTER_PROFILES[character]
    else:
        char_context = f"你是{character}。"

    if system_prompt:
        char_context = f"{char_context}\n\n{system_prompt}"

    # Chat loop
    conversation = []
    while True:
        try:
            user_input = input("You: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye!")
            break

        if user_input.lower() == 'quit':
            print("Goodbye!")
            break
        elif user_input.lower() == 'clear':
            conversation = []
            print("Conversation cleared.\n")
            continue
        elif not user_input:
            continue

        # Build prompt
        conversation.append(f"用户：{user_input}")

        prompt = f"""### Instruction:
{char_context}

请根据以下对话，以{character}的身份回复：

{chr(10).join(conversation)}

### Response:
"""

        # Generate response
        response = generate(model, tokenizer, prompt=prompt, max_tokens=150, verbose=False)

        # Extract just the new response
        response = response.strip()
        conversation.append(f"{character}：{response}")

        print(f"{character}：{response}\n")


def main():
    parser = argparse.ArgumentParser(description="Chat with fine-tuned character model")
    parser.add_argument(
        "--model",
        default="mlx-community/Llama-3.2-1B-Instruct-4bit",
        help="Base model path"
    )
    parser.add_argument(
        "--adapter-path",
        default="outputs/adapters",
        help="Path to LoRA adapters"
    )
    parser.add_argument(
        "--character",
        default="李云龙",
        help="Character to role-play as"
    )
    parser.add_argument(
        "--system-prompt",
        help="Additional system prompt"
    )
    parser.add_argument(
        "--list-characters",
        action="store_true",
        help="List available characters"
    )

    args = parser.parse_args()

    if args.list_characters:
        print("Available characters:")
        for name in CHARACTER_PROFILES.keys():
            print(f"  - {name}")
        print("\nOr use any character name with --character")
        return

    chat(args.model, args.adapter_path, args.character, args.system_prompt)


if __name__ == "__main__":
    main()
