# WebWhisper

純前端的語音轉文字工具，使用瀏覽器錄音並直接呼叫 OpenAI Whisper API。

## 使用方式

1. 開啟 [WebWhisper Pages](https://kirkchu.github.io/webwhisper/)。
2. 輸入自己的 OpenAI API key。
3. 點擊「開始錄音」，說話後再次點擊停止，再按「轉成文字」。

API key 只存在目前瀏覽器分頁的記憶體中，不會傳送到本專案的伺服器；但請注意，純前端呼叫 API 會讓金鑰存在使用者瀏覽器中，請使用具有限額的金鑰並妥善管理。

## 本機開啟

由於瀏覽器的麥克風權限要求安全來源，請使用 VS Code Live Server 或其他本機 HTTP server 開啟 `index.html`。