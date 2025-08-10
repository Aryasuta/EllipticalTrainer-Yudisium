#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// ===== PIN SETTING =====
#define SS_PIN D8
#define RST_PIN D3
#define HALL_SENSOR_PIN D2
#define LED_PIN LED_BUILTIN

// ===== WIFI SETTING =====
const char* ssid = "NOS-Internal";
const char* password = "netos0613";
const String serverInsert = "https://elliptical-backend.vercel.app";

MFRC522 mfrc522(SS_PIN, RST_PIN);

bool sessionActive = false;
bool tickCountingStarted = false;
bool lastMagnetState = HIGH;

unsigned long lastRFIDCheck = 0;
unsigned long lastTickTime = 0;

const unsigned long RFID_INTERVAL = 100;
const unsigned long DEBOUNCE_INTERVAL = 50;

String activeCardID = "";
unsigned long tickCount = 0;

void setup() {
  Serial.begin(115200);
  pinMode(HALL_SENSOR_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);  // LED nyala (belum terkoneksi)

  SPI.begin();
  mfrc522.PCD_Init();

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_PIN, LOW);   // LED nyala
    delay(250);
    Serial.print(".");
  }

  Serial.println("\n✅ WiFi connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Kedipkan LED 10x saat WiFi terkoneksi
  blinkLED(10, 100);

  digitalWrite(LED_PIN, HIGH);  // LED mati setelah berkedip
  Serial.println("== SYSTEM READY ==");
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastRFIDCheck >= RFID_INTERVAL) {
    lastRFIDCheck = currentMillis;

    if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
      // Blink 3x setiap kali kartu RFID terdeteksi
      blinkLED(3, 150);

      String scannedID = "";
      for (byte i = 0; i < mfrc522.uid.size; i++) {
        scannedID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
        scannedID += String(mfrc522.uid.uidByte[i], HEX);
      }
      scannedID.toUpperCase();

      Serial.println("\n🔍 RFID Detected!");
      Serial.println("📇 UID: " + scannedID);

      if (!sessionActive) {
        sessionActive = true;
        tickCountingStarted = false;
        tickCount = 0;
        activeCardID = scannedID;

        Serial.println("📥 Starting session for: " + activeCardID);
        sendCardForDashboard(scannedID);
        sendStartSession(scannedID);

        Serial.println("🟢 SESSION STARTED");
      } else {
        sessionActive = false;

        Serial.println("📤 Ending session for: " + activeCardID);
        sendEndSession(scannedID, tickCount);
        Serial.println("🔴 TICK TOTAL: " + String(tickCount));
      }

      mfrc522.PICC_HaltA();  // Stop reading
    }
  }

  if (sessionActive) {
    int raw = digitalRead(HALL_SENSOR_PIN);
    bool magnetDetected = (raw == LOW);
    unsigned long now = millis();

    if (magnetDetected && !lastMagnetState && now - lastTickTime >= DEBOUNCE_INTERVAL) {
      lastTickTime = now;

      if (!tickCountingStarted) {
        tickCountingStarted = true;
        Serial.println("✅ Tick counting started!");
      } else {
        tickCount++;
        Serial.println("🔁 TICK! Total: " + String(tickCount));

        // Blink LED 1x setiap tick
        blinkLED(1, 150);
      }
    }

    lastMagnetState = magnetDetected;
  }
}

// ===== LED BLINK FUNCTION =====
void blinkLED(int times, int delayMs) {
  for (int i = 0; i < times; i++) {
    digitalWrite(LED_PIN, LOW);   // LED nyala
    delay(delayMs);
    digitalWrite(LED_PIN, HIGH);  // LED mati
    delay(delayMs);
  }
}

// ===== SEND DATA FUNCTIONS =====

void sendCardForDashboard(String cardId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;

    http.begin(client, serverInsert + "/scan/card");
    http.addHeader("Content-Type", "application/json");

    String json = "{\"cardId\":\"" + cardId + "\"}";
    Serial.println("📤 Sending card to dashboard: " + json);

    int code = http.POST(json);
    Serial.println("📩 Response: " + http.getString());

    http.end();
  } else {
    Serial.println("❌ WiFi not connected (sendCardForDashboard)");
  }
}

void sendStartSession(String cardId) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;

    http.begin(client, serverInsert + "/sessions/start");
    http.addHeader("Content-Type", "application/json");

    String json = "{\"cardId\":\"" + cardId + "\"}";
    Serial.println("📤 Starting session: " + json);

    int code = http.POST(json);
    Serial.println("📩 Response: " + http.getString());

    http.end();
  } else {
    Serial.println("❌ WiFi not connected (sendStartSession)");
  }
}

void sendEndSession(String cardId, unsigned long tickCount) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    WiFiClient client;

    http.begin(client, serverInsert + "/sessions/end");
    http.addHeader("Content-Type", "application/json");

    String json = "{\"cardId\":\"" + cardId + "\", \"tickCount\":" + String(tickCount) + "}";
    Serial.println("📤 Ending session: " + json);

    int code = http.POST(json);
    Serial.println("📩 Response: " + http.getString());

    http.end();
  } else {
    Serial.println("❌ WiFi not connected (sendEndSession)");
  }
}