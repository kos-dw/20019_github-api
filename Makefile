.PHONY: setup_git_hooks

# Git管理下に.githooksディレクトリを作成し、その中にpre-commitファイルを作成（実行権限も付与）
# コミット前にリンターとフォーマッターを実行し、コード品質を保つ
# 変更されたファイルを自動でステージングに追加する
setup_git_hooks:
	@mkdir -p .githooks
	@if [ -f .githooks/pre-commit ]; then \
		echo ".githooks/pre-commitは既に存在します。実行権限の付与のみ行います。"; \
	else \
		touch .githooks/pre-commit; \
		echo "#!/bin/sh\nnpm run lint && npm run format && git add -u" > .githooks/pre-commit; \
		echo "Git hooksの新規設定が完了しました"; \
	fi
	@chmod +x .githooks/pre-commit
	@git config core.hooksPath .githooks

