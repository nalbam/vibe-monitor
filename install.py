#!/usr/bin/env python3
"""
Vibe Monitor Installation Script
Installs hooks and configuration for Claude Code or Kiro IDE.
"""

import difflib
import json
import shutil
import sys
from pathlib import Path


def colored(text: str, color: str) -> str:
    """Return colored text for terminal output."""
    colors = {
        "red": "\033[91m",
        "green": "\033[92m",
        "yellow": "\033[93m",
        "blue": "\033[94m",
        "cyan": "\033[96m",
        "reset": "\033[0m",
    }
    return f"{colors.get(color, '')}{text}{colors['reset']}"


def ask_yes_no(question: str, default: bool = True) -> bool:
    """Ask a yes/no question and return the answer."""
    suffix = "[Y/n]" if default else "[y/N]"
    while True:
        answer = input(f"{question} {suffix}: ").strip().lower()
        if not answer:
            return default
        if answer in ("y", "yes"):
            return True
        if answer in ("n", "no"):
            return False
        print("Please answer 'y' or 'n'")


def copy_file(src: Path, dst: Path, description: str) -> bool:
    """Copy a file and print status."""
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  {colored('✓', 'green')} {description}")
        return True
    except Exception as e:
        print(f"  {colored('✗', 'red')} {description}: {e}")
        return False


def show_diff(old_content: str, new_content: str, filename: str) -> bool:
    """Show unified diff between old and new content. Returns True if different."""
    old_lines = old_content.splitlines(keepends=True)
    new_lines = new_content.splitlines(keepends=True)

    diff = list(difflib.unified_diff(
        old_lines, new_lines,
        fromfile=f"existing {filename}",
        tofile=f"new {filename}",
        lineterm=""
    ))

    if not diff:
        return False

    print(f"\n  {colored('Diff:', 'yellow')}")
    for line in diff[:50]:  # Limit to 50 lines
        line = line.rstrip("\n")
        if line.startswith("+") and not line.startswith("+++"):
            print(f"    {colored(line, 'green')}")
        elif line.startswith("-") and not line.startswith("---"):
            print(f"    {colored(line, 'red')}")
        elif line.startswith("@@"):
            print(f"    {colored(line, 'cyan')}")
        else:
            print(f"    {line}")

    if len(diff) > 50:
        print(f"    {colored(f'... ({len(diff) - 50} more lines)', 'yellow')}")

    return True


def copy_file_with_diff(src: Path, dst: Path, description: str) -> bool:
    """Copy a file, showing diff and asking for confirmation if it already exists."""
    try:
        dst.parent.mkdir(parents=True, exist_ok=True)

        if dst.exists():
            old_content = dst.read_text()
            new_content = src.read_text()

            if old_content == new_content:
                print(f"  {colored('✓', 'green')} {description} (no changes)")
                return True

            print(f"\n  {colored('!', 'yellow')} {description} already exists")
            has_diff = show_diff(old_content, new_content, dst.name)

            if has_diff:
                if ask_yes_no(f"  Overwrite {description}?"):
                    shutil.copy2(src, dst)
                    print(f"  {colored('✓', 'green')} {description} (updated)")
                    return True
                else:
                    print(f"  {colored('!', 'yellow')} {description} (skipped)")
                    return False
        else:
            shutil.copy2(src, dst)
            print(f"  {colored('✓', 'green')} {description}")
            return True

    except Exception as e:
        print(f"  {colored('✗', 'red')} {description}: {e}")
        return False


def copy_directory(src: Path, dst: Path, description: str) -> bool:
    """Copy a directory recursively and print status."""
    try:
        if dst.exists():
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f"  {colored('✓', 'green')} {description}")
        return True
    except Exception as e:
        print(f"  {colored('✗', 'red')} {description}: {e}")
        return False


def get_hook_commands(hook_entries: list) -> set:
    """Extract all command strings from hook entries."""
    commands = set()
    for entry in hook_entries:
        # New format: { "matcher": "", "hooks": [{ "type": "command", "command": "..." }] }
        if "hooks" in entry:
            for hook in entry.get("hooks", []):
                if "command" in hook:
                    commands.add(hook["command"])
        # Legacy format: { "command": "..." }
        elif "command" in entry:
            commands.add(entry["command"])
    return commands


def merge_hooks(existing: dict, new_hooks: dict) -> dict:
    """Merge new hooks into existing hooks configuration."""
    result = {}

    for event, new_entries in new_hooks.items():
        if event not in existing:
            result[event] = new_entries
        else:
            existing_entries = existing[event]
            existing_cmds = get_hook_commands(existing_entries)

            # Start with existing entries
            result[event] = existing_entries.copy()

            # Add new entries if their commands don't already exist
            for new_entry in new_entries:
                new_cmds = get_hook_commands([new_entry])
                if not new_cmds.intersection(existing_cmds):
                    result[event].append(new_entry)

    # Keep any existing events not in new_hooks
    for event in existing:
        if event not in result:
            result[event] = existing[event]

    return result


def install_claude(script_dir: Path) -> bool:
    """Install Vibe Monitor for Claude Code."""
    print(f"\n{colored('Installing Vibe Monitor for Claude Code...', 'cyan')}\n")

    claude_home = Path.home() / ".claude"
    config_dir = script_dir / "config" / "claude"

    # Create directories
    claude_home.mkdir(parents=True, exist_ok=True)
    (claude_home / "hooks").mkdir(parents=True, exist_ok=True)
    (claude_home / "skills").mkdir(parents=True, exist_ok=True)

    # Copy files
    print("Copying files:")
    copy_file_with_diff(
        config_dir / "statusline.py",
        claude_home / "statusline.py",
        "statusline.py",
    )
    copy_file_with_diff(
        config_dir / "hooks" / "vibe-monitor.py",
        claude_home / "hooks" / "vibe-monitor.py",
        "hooks/vibe-monitor.py",
    )
    copy_file(
        config_dir / ".env.sample",
        claude_home / ".env.sample",
        ".env.sample",
    )

    # Copy skills directories
    copy_directory(
        config_dir / "skills" / "vibemon-lock",
        claude_home / "skills" / "vibemon-lock",
        "skills/vibemon-lock/",
    )
    copy_directory(
        config_dir / "skills" / "vibemon-mode",
        claude_home / "skills" / "vibemon-mode",
        "skills/vibemon-mode/",
    )

    # Handle .env.local
    env_local = claude_home / ".env.local"
    if not env_local.exists():
        print()
        if ask_yes_no("Copy .env.sample to .env.local?"):
            copy_file(
                config_dir / ".env.sample",
                env_local,
                ".env.local (from .env.sample)",
            )
    else:
        print(f"\n  {colored('!', 'yellow')} .env.local already exists, skipping")

    # Handle settings.json
    print("\nConfiguring settings.json:")
    settings_file = claude_home / "settings.json"
    new_settings = json.loads((config_dir / "settings.json").read_text())

    if settings_file.exists():
        try:
            existing_settings = json.loads(settings_file.read_text())
        except json.JSONDecodeError:
            existing_settings = {}

        # Merge hooks
        if "hooks" in existing_settings:
            existing_settings["hooks"] = merge_hooks(
                existing_settings["hooks"], new_settings["hooks"]
            )
        else:
            existing_settings["hooks"] = new_settings["hooks"]

        # Handle statusLine
        if "statusLine" in existing_settings:
            existing_cmd = existing_settings["statusLine"].get("command", "")
            new_cmd = new_settings["statusLine"].get("command", "")
            if existing_cmd != new_cmd:
                print(f"\n  Current statusLine: {colored(existing_cmd, 'yellow')}")
                print(f"  New statusLine:     {colored(new_cmd, 'cyan')}")
                if ask_yes_no("Replace statusLine?"):
                    existing_settings["statusLine"] = new_settings["statusLine"]
                    print(f"  {colored('✓', 'green')} statusLine updated")
                else:
                    print(f"  {colored('!', 'yellow')} statusLine unchanged")
            else:
                print(f"  {colored('✓', 'green')} statusLine already configured")
        else:
            existing_settings["statusLine"] = new_settings["statusLine"]
            print(f"  {colored('✓', 'green')} statusLine added")

        # Write merged settings
        settings_file.write_text(json.dumps(existing_settings, indent=2) + "\n")
        print(f"  {colored('✓', 'green')} hooks merged into settings.json")
    else:
        # Create new settings.json
        settings_file.write_text(json.dumps(new_settings, indent=2) + "\n")
        print(f"  {colored('✓', 'green')} settings.json created")

    print(f"\n{colored('Claude Code installation complete!', 'green')}")
    return True


def install_kiro(script_dir: Path) -> bool:
    """Install Vibe Monitor for Kiro IDE."""
    print(f"\n{colored('Installing Vibe Monitor for Kiro IDE...', 'cyan')}\n")

    kiro_home = Path.home() / ".kiro"
    config_dir = script_dir / "config" / "kiro"

    # Create directories
    kiro_home.mkdir(parents=True, exist_ok=True)
    (kiro_home / "hooks").mkdir(parents=True, exist_ok=True)

    # Copy hook files
    print("Copying files:")
    hooks_dir = config_dir / "hooks"
    for hook_file in hooks_dir.glob("*.kiro.hook"):
        copy_file(
            hook_file,
            kiro_home / "hooks" / hook_file.name,
            f"hooks/{hook_file.name}",
        )

    copy_file_with_diff(
        hooks_dir / "vibe-monitor.py",
        kiro_home / "hooks" / "vibe-monitor.py",
        "hooks/vibe-monitor.py",
    )
    copy_file(
        config_dir / ".env.sample",
        kiro_home / ".env.sample",
        ".env.sample",
    )

    # Handle .env.local
    env_local = kiro_home / ".env.local"
    if not env_local.exists():
        print()
        if ask_yes_no("Copy .env.sample to .env.local?"):
            copy_file(
                config_dir / ".env.sample",
                env_local,
                ".env.local (from .env.sample)",
            )
    else:
        print(f"\n  {colored('!', 'yellow')} .env.local already exists, skipping")

    print(f"\n{colored('Kiro IDE installation complete!', 'green')}")
    return True


def main():
    """Main entry point."""
    script_dir = Path(__file__).parent.resolve()

    print(f"\n{colored('╔════════════════════════════════════════╗', 'cyan')}")
    print(f"{colored('║', 'cyan')}   Vibe Monitor Installation Script    {colored('║', 'cyan')}")
    print(f"{colored('╚════════════════════════════════════════╝', 'cyan')}")

    # Check if config directories exist
    if not (script_dir / "config" / "claude").exists():
        print(f"\n{colored('Error:', 'red')} config/claude directory not found")
        print("Please run this script from the vibe-monitor repository root")
        sys.exit(1)

    if not (script_dir / "config" / "kiro").exists():
        print(f"\n{colored('Error:', 'red')} config/kiro directory not found")
        print("Please run this script from the vibe-monitor repository root")
        sys.exit(1)

    # Select platform
    print("\nSelect platform to install:")
    print(f"  {colored('1)', 'cyan')} Claude Code")
    print(f"  {colored('2)', 'cyan')} Kiro IDE")
    print(f"  {colored('3)', 'cyan')} Both")
    print(f"  {colored('q)', 'cyan')} Quit")

    while True:
        choice = input("\nYour choice [1/2/3/q]: ").strip().lower()
        if choice in ("1", "claude"):
            install_claude(script_dir)
            break
        elif choice in ("2", "kiro"):
            install_kiro(script_dir)
            break
        elif choice in ("3", "both"):
            install_claude(script_dir)
            install_kiro(script_dir)
            break
        elif choice in ("q", "quit", "exit"):
            print("\nInstallation cancelled.")
            sys.exit(0)
        else:
            print("Please enter 1, 2, 3, or q")

    print(f"\n{colored('Done!', 'green')} Restart Claude Code or Kiro to apply changes.\n")


if __name__ == "__main__":
    main()
