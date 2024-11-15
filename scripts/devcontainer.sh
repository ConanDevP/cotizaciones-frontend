#!/bin/bash

sudo apt-get update && sudo apt-get install -y zsh git curl wget fonts-powerline

sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

mkdir -p ~/.local/share/fonts && cd ~/.local/share/fonts
curl -fLO https://github.com/ryanoasis/nerd-fonts/raw/HEAD/patched-fonts/Hermit/Regular/HurmitNerdFont-Regular.otf
curl -fLO https://github.com/ryanoasis/nerd-fonts/raw/HEAD/patched-fonts/Hermit/Bold/HurmitNerdFont-Bold.otf
curl -fLO https://github.com/ryanoasis/nerd-fonts/raw/HEAD/patched-fonts/RecMono/Regular/RecMonoNerdFont-Regular.otf
curl -fLO https://github.com/ryanoasis/nerd-fonts/raw/HEAD/patched-fonts/RecMono/Bold/RecMonoNerdFont-Bold.otf
fc-cache -fv

if [ ! -d "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k" ]; then
  git clone --depth=1 https://github.com/romkatv/powerlevel10k.git ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k
fi

echo 'ZSH_THEME="powerlevel10k/powerlevel10k"' >> ~/.zshrc
echo 'source ${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/themes/powerlevel10k/powerlevel10k.zsh-theme' >> ~/.zshrc
echo '[[ ! -f ~/.p10k.zsh ]] || source ~/.p10k.zsh' >> ~/.zshrc

git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-completions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions
echo 'plugins=(git zsh-syntax-highlighting zsh-autosuggestions zsh-completions)' >> ~/.zshrc

source ~/.zshrc

echo "Powerlevel10k, fuentes y plugins adicionales instalados y configurados exitosamente"
