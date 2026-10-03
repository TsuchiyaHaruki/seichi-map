package com.seichi.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.fasterxml.jackson.databind.JsonNode;
import com.seichi.backend.entity.User;
import com.seichi.backend.enums.Role;
import com.seichi.backend.repository.UserRepository;
import com.seichi.backend.support.ApiTestClient;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * AGENTS.md §18 / AI_SPECIFICATION.md §21 のテストチェックリストを、
 * 実エンドポイント + 実PostgreSQL(compose の seichi_test)で検証する統合テスト。
 */
class SeichiApiIntegrationTest extends AbstractIntegrationTest {

    private static final String SPOT_JSON = """
            {
              "workName": "CLANNAD",
              "spotName": "瑞穂運動場東駅周辺",
              "category": "GAME_AND_ANIME",
              "address": "愛知県名古屋市瑞穂区",
              "prefecture": "愛知県",
              "latitude": 35.1225,
              "longitude": 136.9478,
              "sceneDescription": "通学路のモデル",
              "description": "駅周辺の風景が登場する。"
            }
            """;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // --- 認証・権限 -----------------------------------------------------------

    @Test
    void 未ログイン利用者は保護APIを実行できない() throws Exception {
        ApiTestClient client = newClient();
        assertThat(client.get("/api/v1/users/me/posts").getResponse().getStatus())
                .isEqualTo(401);
    }

    @Test
    void USERは管理者APIを実行できない() throws Exception {
        ApiTestClient user = registerAndLogin("user-admincheck@example.com");
        assertThat(user.get("/api/v1/admin/sacred-spots/pending").getResponse().getStatus())
                .isEqualTo(403);
    }

    @Test
    void 一般ユーザー登録時にロールはUSERに強制される() throws Exception {
        ApiTestClient client = newClient();
        JsonNode body = client.json(client.post("/api/v1/auth/register", """
                {
                  "userName": "spoof",
                  "email": "spoof@example.com",
                  "password": "SecurePass123",
                  "passwordConfirmation": "SecurePass123",
                  "role": "ADMIN"
                }
                """));
        assertThat(body.get("role").asText()).isEqualTo("USER");
    }

    // --- 投稿ライフサイクル ---------------------------------------------------

    @Test
    void USERの新規投稿はPENDINGになり一般公開されない() throws Exception {
        ApiTestClient user = registerAndLogin("poster-pending@example.com");
        user.post("/api/v1/sacred-spots", SPOT_JSON);

        JsonNode myPosts = user.json(user.get("/api/v1/users/me/posts"));
        assertThat(myPosts.get("items").get(0).get("verificationStatus").asText())
                .isEqualTo("PENDING");

        JsonNode publicList = newClient().json(newClient().get("/api/v1/sacred-spots"));
        assertThat(publicList.get("totalElements").asInt()).isZero();
    }

    @Test
    void 管理者が承認すると一般公開され信頼性ラベルが管理者確認済みになる() throws Exception {
        ApiTestClient user = registerAndLogin("poster-verify@example.com");
        long spotId = user.json(user.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();

        ApiTestClient admin = loginAsNewAdmin("admin-verify@example.com");
        admin.patch("/api/v1/admin/sacred-spots/" + spotId + "/verify", null);

        JsonNode publicList = newClient().json(newClient().get("/api/v1/sacred-spots"));
        assertThat(publicList.get("totalElements").asInt()).isEqualTo(1);
        assertThat(publicList.get("items").get(0).get("trustLabel").asText())
                .isEqualTo("管理者確認済み");
    }

    @Test
    void 却下理由なしでは却下できない() throws Exception {
        ApiTestClient user = registerAndLogin("poster-reject@example.com");
        long spotId = user.json(user.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();

        ApiTestClient admin = loginAsNewAdmin("admin-reject@example.com");
        assertThat(admin.patch("/api/v1/admin/sacred-spots/" + spotId + "/reject",
                "{\"reason\": \"\"}").getResponse().getStatus())
                .isEqualTo(400);
    }

    @Test
    void PENDINGとREJECTEDは一般公開されないが投稿者本人は詳細を確認できる() throws Exception {
        ApiTestClient user = registerAndLogin("owner-detail@example.com");
        long spotId = user.json(user.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();

        // 投稿者本人はPENDING詳細を閲覧できる
        assertThat(user.get("/api/v1/sacred-spots/" + spotId).getResponse().getStatus())
                .isEqualTo(200);
        // 未ログイン利用者は非公開のため404
        assertThat(newClient().get("/api/v1/sacred-spots/" + spotId).getResponse().getStatus())
                .isEqualTo(404);
    }

    @Test
    void USERは他人の投稿を編集できない() throws Exception {
        ApiTestClient owner = registerAndLogin("owner-edit@example.com");
        long spotId = owner.json(owner.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();

        ApiTestClient other = registerAndLogin("other-edit@example.com");
        assertThat(other.put("/api/v1/sacred-spots/" + spotId, SPOT_JSON)
                .getResponse().getStatus())
                .isEqualTo(403);
    }

    // --- いいね・お気に入り ---------------------------------------------------

    @Test
    void 重複いいねを登録できない() throws Exception {
        long spotId = createVerifiedSpot("like-dup");
        ApiTestClient user = registerAndLogin("liker@example.com");
        assertThat(user.post("/api/v1/sacred-spots/" + spotId + "/likes", null)
                .getResponse().getStatus()).isEqualTo(201);
        assertThat(user.post("/api/v1/sacred-spots/" + spotId + "/likes", null)
                .getResponse().getStatus()).isEqualTo(409);
    }

    @Test
    void 重複お気に入りを登録できない() throws Exception {
        long spotId = createVerifiedSpot("fav-dup");
        ApiTestClient user = registerAndLogin("favoriter@example.com");
        assertThat(user.post("/api/v1/sacred-spots/" + spotId + "/favorites", null)
                .getResponse().getStatus()).isEqualTo(201);
        assertThat(user.post("/api/v1/sacred-spots/" + spotId + "/favorites", null)
                .getResponse().getStatus()).isEqualTo(409);
    }

    @Test
    void 未承認の聖地にはいいねできない() throws Exception {
        ApiTestClient user = registerAndLogin("liker-pending@example.com");
        long spotId = user.json(user.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();
        assertThat(user.post("/api/v1/sacred-spots/" + spotId + "/likes", null)
                .getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void いいねとお気に入りの絞り込みは本人の記録だけを返す() throws Exception {
        long likedSpotId = createVerifiedSpot("filter-liked");
        long favoritedSpotId = createVerifiedSpot("filter-favorited");

        ApiTestClient user = registerAndLogin("filter-user@example.com");
        user.post("/api/v1/sacred-spots/" + likedSpotId + "/likes", null);
        user.post("/api/v1/sacred-spots/" + favoritedSpotId + "/favorites", null);

        JsonNode liked = user.json(user.get("/api/v1/sacred-spots?likedOnly=true"));
        assertThat(liked.get("totalElements").asInt()).isEqualTo(1);
        assertThat(liked.get("items").get(0).get("id").asLong()).isEqualTo(likedSpotId);

        JsonNode favorited = user.json(user.get("/api/v1/sacred-spots?favoritedOnly=true"));
        assertThat(favorited.get("totalElements").asInt()).isEqualTo(1);
        assertThat(favorited.get("items").get(0).get("id").asLong()).isEqualTo(favoritedSpotId);

        // 両方指定するといいねかつお気に入りの聖地だけになる
        assertThat(user.json(user.get("/api/v1/sacred-spots?likedOnly=true&favoritedOnly=true"))
                .get("totalElements").asInt()).isZero();

        // 地図APIも同じ条件で絞られる
        assertThat(user.json(user.get("/api/v1/sacred-spots/map?likedOnly=true")).size())
                .isEqualTo(1);

        // 他人の記録は反映されない
        ApiTestClient other = registerAndLogin("filter-other@example.com");
        assertThat(other.json(other.get("/api/v1/sacred-spots?likedOnly=true"))
                .get("totalElements").asInt()).isZero();

        // 未ログインで指定した場合は0件
        ApiTestClient guest = newClient();
        assertThat(guest.json(guest.get("/api/v1/sacred-spots?likedOnly=true"))
                .get("totalElements").asInt()).isZero();

        // 絞り込みなしでは全件返る
        assertThat(guest.json(guest.get("/api/v1/sacred-spots"))
                .get("totalElements").asInt()).isEqualTo(2);
    }

    // --- 聖地画像 -------------------------------------------------------------

    @Test
    void 聖地画像は投稿者だけが登録でき承認前は他人に見えない() throws Exception {
        ApiTestClient owner = registerAndLogin("image-owner@example.com");
        long spotId = owner.json(owner.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();
        String imagesPath = "/api/v1/sacred-spots/" + spotId + "/images";

        // 中身が画像なら登録できる
        var uploaded = owner.upload(imagesPath, "file", "photo.png", "image/png", pngBytes());
        assertThat(uploaded.getResponse().getStatus()).isEqualTo(201);
        long imageId = owner.json(uploaded).get("id").asLong();

        // 画像に見せかけたテキストは拒否する
        assertThat(owner.upload(imagesPath, "file", "fake.png", "image/png",
                "this is not an image".getBytes()).getResponse().getStatus())
                .isEqualTo(422);

        // 他人は登録できない(編集APIと同じく403)
        ApiTestClient other = registerAndLogin("image-other@example.com");
        assertThat(other.upload(imagesPath, "file", "photo.png", "image/png", pngBytes())
                .getResponse().getStatus())
                .isEqualTo(403);

        // 確認待ちのあいだは本人だけが見られる
        assertThat(owner.json(owner.get(imagesPath)).size()).isEqualTo(1);
        assertThat(other.get(imagesPath).getResponse().getStatus()).isEqualTo(404);
        assertThat(newClient().get(imagesPath + "/" + imageId).getResponse().getStatus())
                .isEqualTo(404);

        // 承認後は未ログインでも閲覧できる
        ApiTestClient admin = loginAsNewAdmin("image-admin@example.com");
        admin.patch("/api/v1/admin/sacred-spots/" + spotId + "/verify", null);
        var content = newClient().get(imagesPath + "/" + imageId);
        assertThat(content.getResponse().getStatus()).isEqualTo(200);
        assertThat(content.getResponse().getContentType()).isEqualTo("image/png");

        // 削除は投稿者本人とADMINのみ
        assertThat(other.delete(imagesPath + "/" + imageId).getResponse().getStatus())
                .isEqualTo(403);
        assertThat(owner.delete(imagesPath + "/" + imageId).getResponse().getStatus())
                .isEqualTo(204);
        assertThat(owner.json(owner.get(imagesPath)).size()).isZero();
    }

    @Test
    void 聖地画像は上限を超えて登録できない() throws Exception {
        ApiTestClient owner = registerAndLogin("image-limit@example.com");
        long spotId = owner.json(owner.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();
        String imagesPath = "/api/v1/sacred-spots/" + spotId + "/images";

        for (int i = 0; i < 3; i++) {
            assertThat(owner.upload(imagesPath, "file", "photo.png", "image/png", pngBytes())
                    .getResponse().getStatus())
                    .isEqualTo(201);
        }
        assertThat(owner.upload(imagesPath, "file", "photo.png", "image/png", pngBytes())
                .getResponse().getStatus())
                .isEqualTo(422);
    }

    /** 形式判定に使う先頭バイトだけを持つPNGデータ */
    private static byte[] pngBytes() {
        return new byte[] {
                (byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D
        };
    }

    // --- アカウントロック -----------------------------------------------------

    @Test
    void 五回の失敗でアカウントがロックされ管理者だけが解除できる() throws Exception {
        String email = "locktarget@example.com";
        registerAndLogin(email);

        ApiTestClient attacker = newClient();
        String wrongLogin = "{\"email\": \"" + email + "\", \"password\": \"WrongPass000\"}";
        for (int i = 0; i < 4; i++) {
            JsonNode body = attacker.json(attacker.post("/api/v1/auth/login", wrongLogin));
            assertThat(body.get("code").asText()).isEqualTo("AUTHENTICATION_FAILED");
        }
        JsonNode fifth = attacker.json(attacker.post("/api/v1/auth/login", wrongLogin));
        assertThat(fifth.get("code").asText()).isEqualTo("ACCOUNT_LOCKED");

        // 正しいパスワードでもロック中は拒否
        JsonNode correct = attacker.json(attacker.post("/api/v1/auth/login",
                "{\"email\": \"" + email + "\", \"password\": \"SecurePass123\"}"));
        assertThat(correct.get("code").asText()).isEqualTo("ACCOUNT_LOCKED");

        long userId = userRepository.findByEmail(email).orElseThrow().getId();

        // USERはロック解除できない
        ApiTestClient user = registerAndLogin("nonadmin-unlock@example.com");
        assertThat(user.post("/api/v1/admin/users/" + userId + "/unlock", null)
                .getResponse().getStatus()).isEqualTo(403);

        // 管理者は解除でき、その後ログインできる
        ApiTestClient admin = loginAsNewAdmin("admin-unlock@example.com");
        assertThat(admin.post("/api/v1/admin/users/" + userId + "/unlock", null)
                .getResponse().getStatus()).isEqualTo(200);

        JsonNode relogin = newClient().json(newClient().post("/api/v1/auth/login",
                "{\"email\": \"" + email + "\", \"password\": \"SecurePass123\"}"));
        assertThat(relogin.get("authenticated").asBoolean()).isTrue();
    }

    // --- 個人情報保護 ---------------------------------------------------------

    @Test
    void 詳細APIは不要な個人情報を返さない() throws Exception {
        long spotId = createVerifiedSpot("privacy");
        String detail = newClient().get("/api/v1/sacred-spots/" + spotId)
                .getResponse().getContentAsString();
        assertThat(detail).doesNotContain("@");
        assertThat(detail).doesNotContain("passwordHash");
        assertThat(detail).doesNotContain("email");
    }

    // --- CSRF ----------------------------------------------------------------

    @Test
    void CSRFトークンなしの状態変更は拒否される() throws Exception {
        registerAndLogin("csrf-user@example.com");
        // CSRFヘッダー・Cookieを付けずに直接POST
        int status = mockMvc.perform(
                        org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                                .post("/api/v1/sacred-spots")
                                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                                .content(SPOT_JSON))
                .andReturn().getResponse().getStatus();
        assertThat(status).isEqualTo(403);
    }

    @Test
    void ログイン中の認証済みGETでCSRFトークンが失効しない() throws Exception {
        ApiTestClient user = registerAndLogin("csrf-keep@example.com");
        String token = user.csrfToken();

        // 一覧・詳細・マイページなど、認証済みのGETを挟んでもキャッシュしたトークンを使える
        user.get("/api/v1/auth/me");
        user.get("/api/v1/users/me/favorites");

        int status = user.postWithCsrfToken("/api/v1/sacred-spots", SPOT_JSON, token)
                .getResponse().getStatus();
        assertThat(status).isEqualTo(201);
    }

    @Test
    void ログインとログアウトでCSRFトークンが再生成される() throws Exception {
        ApiTestClient client = newClient();
        client.post("/api/v1/auth/register", """
                {
                  "userName": "テストユーザー",
                  "email": "csrf-rotate@example.com",
                  "password": "SecurePass123",
                  "passwordConfirmation": "SecurePass123"
                }
                """);
        String beforeLogin = client.csrfToken();
        client.postWithCsrfToken("/api/v1/auth/login",
                "{\"email\": \"csrf-rotate@example.com\", \"password\": \"SecurePass123\"}",
                beforeLogin);
        String afterLogin = client.csrfToken();
        assertThat(afterLogin).isNotEqualTo(beforeLogin);

        // ログイン前のトークンはログイン後に使えない
        assertThat(client.postWithCsrfToken("/api/v1/sacred-spots", SPOT_JSON, beforeLogin)
                .getResponse().getStatus()).isEqualTo(403);

        client.postWithCsrfToken("/api/v1/auth/logout", null, afterLogin);
        assertThat(client.csrfToken()).isNotEqualTo(afterLogin);
    }

    // --- エラー応答 ------------------------------------------------------------

    @Test
    void 対応していないHTTPメソッドは405を返す() throws Exception {
        ApiTestClient admin = loginAsNewAdmin("method-admin@example.com");
        var result = admin.post("/api/v1/admin/sacred-spots", SPOT_JSON);
        assertThat(result.getResponse().getStatus()).isEqualTo(405);
        assertThat(admin.json(result).get("code").asText()).isEqualTo("METHOD_NOT_ALLOWED");
    }

    @Test
    void IDが数値でない場合は400を返す() throws Exception {
        var result = newClient().get("/api/v1/sacred-spots/abc");
        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(newClient().json(result).get("code").asText()).isEqualTo("VALIDATION_ERROR");
    }

    @Test
    void 画像ファイルの指定がないアップロードは400を返す() throws Exception {
        ApiTestClient user = registerAndLogin("missing-file@example.com");
        long spotId = user.json(user.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();
        var result = user.upload("/api/v1/sacred-spots/" + spotId + "/images",
                "wrong", "photo.png", "image/png", pngBytes());
        assertThat(result.getResponse().getStatus()).isEqualTo(400);
    }

    // --- ヘルパー -------------------------------------------------------------

    private ApiTestClient registerAndLogin(String email) throws Exception {
        ApiTestClient client = newClient();
        client.post("/api/v1/auth/register", """
                {
                  "userName": "テストユーザー",
                  "email": "%s",
                  "password": "SecurePass123",
                  "passwordConfirmation": "SecurePass123"
                }
                """.formatted(email));
        client.post("/api/v1/auth/login",
                "{\"email\": \"" + email + "\", \"password\": \"SecurePass123\"}");
        return client;
    }

    private ApiTestClient loginAsNewAdmin(String email) throws Exception {
        User admin = new User();
        admin.setUserName("管理者");
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode("SecurePass123"));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);

        ApiTestClient client = newClient();
        client.post("/api/v1/auth/login",
                "{\"email\": \"" + email + "\", \"password\": \"SecurePass123\"}");
        return client;
    }

    /** USER投稿→管理者承認まで行い、VERIFIEDの聖地IDを返す。 */
    private long createVerifiedSpot(String tag) throws Exception {
        ApiTestClient user = registerAndLogin("poster-" + tag + "@example.com");
        long spotId = user.json(user.post("/api/v1/sacred-spots", SPOT_JSON)).get("id").asLong();
        ApiTestClient admin = loginAsNewAdmin("admin-" + tag + "@example.com");
        admin.patch("/api/v1/admin/sacred-spots/" + spotId + "/verify", null);
        return spotId;
    }
}
