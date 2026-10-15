import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const supabase = createClient(
  "https://rppzoyfpqsllsujrrfsx.supabase.co",
  "sb_publishable_UYmoDieWNyfDWHWZkqk6NQ_tDDs8RbM",
);

const authorizationId = new URLSearchParams(window.location.search).get("authorization_id");
const login = document.querySelector("#login");
const decision = document.querySelector("#decision");
const details = document.querySelector("#details");
const account = document.querySelector("#account");
const message = document.querySelector("#message");
const signin = document.querySelector("#signin");
const approve = document.querySelector("#approve");
const deny = document.querySelector("#deny");

function showMessage(text) {
  message.textContent = text;
}

function setBusy(busy) {
  signin.disabled = busy;
  approve.disabled = busy;
  deny.disabled = busy;
}

async function loadAuthorization() {
  if (!authorizationId) {
    showMessage("接続情報がありません。ChatGPTからもう一度接続してください。");
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    details.textContent = "物語スタジオと同じアカウントでログインしてください。";
    login.hidden = false;
    decision.hidden = true;
    return;
  }

  const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
  if (error) {
    showMessage(error.message);
    return;
  }
  if (data.redirect_url) {
    window.location.assign(data.redirect_url);
    return;
  }

  details.textContent = `${data.client?.name ?? "ChatGPT"}が、あなたの作品データへのアクセス許可を求めています。`;
  account.textContent = session.user.email ?? "ログイン済みアカウント";
  login.hidden = true;
  decision.hidden = false;
}

login.addEventListener("submit", async (event) => {
  event.preventDefault();
  setBusy(true);
  showMessage("ログインしています…");
  const { error } = await supabase.auth.signInWithPassword({
    email: document.querySelector("#email").value,
    password: document.querySelector("#password").value,
  });
  setBusy(false);
  showMessage(error?.message ?? "");
  if (!error) await loadAuthorization();
});

async function decide(allow) {
  setBusy(true);
  showMessage("接続を処理しています…");
  const method = allow ? "approveAuthorization" : "denyAuthorization";
  const { data, error } = await supabase.auth.oauth[method](authorizationId);
  if (error) {
    setBusy(false);
    showMessage(error.message);
    return;
  }
  window.location.assign(data.redirect_url);
}

approve.addEventListener("click", () => decide(true));
deny.addEventListener("click", () => decide(false));
loadAuthorization();
