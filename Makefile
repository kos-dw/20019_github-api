.PHONY: setup_git_hooks

# Git管理下に.githooksディレクトリを作成し、その中にpre-commitファイルを作成（実行権限も付与）
# コミット前にリンターとフォーマッターを実行し、コード品質を保つ
# 変更されたファイルを自動でステージングに追加する
setup_git_hooks:
	@if [ -f .githooks/pre-commit ]; then \
		echo ".githooks/pre-commitは既に存在します"; \
	else \
		mkdir -p .githooks; \
		touch .githooks/pre-commit; \
		chmod +x .githooks/pre-commit; \
		git config core.hooksPath .githooks; \
		echo "#!/bin/sh\nnpm run lint && npm run format && git add -u" > .githooks/pre-commit; \
		echo "Git hooksの設定が完了しました"; \
	fi

