const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");

// قراءة البيانات من الملف النصي وتحويلها إلى قائمة من الأشخاص
const users = fs
  .readFileSync("data.txt", "utf-8")
  .split("\n")
  .filter((line) => line.trim() !== "") // تجاهل الأسطر الفارغة
  .map((line) => {
    const [numeroWassit, numeroPieceIdentite, ccp] = line.split(",");
    return {
      numeroWassit: numeroWassit.trim(),
      numeroPieceIdentite: numeroPieceIdentite.trim(),
      ccp: ccp.trim(),
    };
  });

async function openTabAndFillForm(driver, user, index) {
  // طباعة رسالة في الكونسول
  console.log(
    `Processing user ${index + 1}: numeroWassit = ${
      user.numeroWassit
    }, numeroPieceIdentite = ${user.numeroPieceIdentite}, ccp = ${user.ccp}`
  );

  const tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[tabs.length - 1]);

  // فتح الموقع في علامة التبويب الجديدة
  await driver.get("https://minha.anem.dz/pre_inscription"); // قم بتغيير الرابط إلى الرابط الفعلي

  // تعبئة الحقل الأول
  await driver.findElement(By.id("numeroWassit")).sendKeys(user.numeroWassit);

  // تعبئة الحقل الثاني
  await driver
    .findElement(By.id("numeroPieceIdentite"))
    .sendKeys(user.numeroPieceIdentite);

  // الضغط على الزر الأول
  await driver.findElement(By.id("mui-5")).click();

  // الانتظار حتى يظهر الزر المطلوب "المواصلة"
  const continueButton = await driver.wait(
    until.elementLocated(
      By.xpath(
        "//button[contains(@class, 'MuiButtonBase-root') and contains(text(), 'المواصلة')]"
      )
    ),
    10000
  );

  // الضغط على الزر "المواصلة"
  await continueButton.click();

  // الانتظار حتى تظهر العناصر المطلوبة
  const pElement = await driver.wait(until.elementLocated(By.id("p")), 10000);
  const nElement = await driver.wait(until.elementLocated(By.id("n")), 10000);
  const cElement = await driver.wait(until.elementLocated(By.id("c")), 10000);

  // نسخ النص من العناصر المحددة
  const bElement = await driver.findElement(
    By.xpath(
      '//span[contains(@class, "MuiTypography-root") and contains(@class, "MuiTypography-body3Fr")]'
    )
  );
  const nElementText = await driver.findElement(
    By.xpath(
      '//span[contains(@class, "MuiTypography-root") and contains(@class, "MuiTypography-body3Fr")]'
    )
  );

  // الحصول على النص من العناصر
  const bText = await driver.executeScript(
    "return arguments[0].textContent;",
    bElement
  );
  const nText = await driver.executeScript(
    "return arguments[0].textContent;",
    nElementText
  );

  // إدخال النص في الحقول المخصصة
  await pElement.sendKeys(bText.trim()); // إزالة المسافات الزائدة
  await nElement.sendKeys(nText.trim()); // إزالة المسافات الزائدة
  await cElement.sendKeys(user.ccp);
}

async function run() {
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options())
    .build();

  try {
    // افتح علامة تبويب لكل شخص في القائمة
    for (let i = 0; i < users.length; i++) {
      await openTabAndFillForm(driver, users[i], i);
    }

    // التبديل إلى أول علامة تبويب بعد الانتهاء
    const tabs = await driver.getAllWindowHandles();
    await driver.switchTo().window(tabs[0]);
  } finally {
    // لا تغلق المتصفح إذا كنت تريد الاحتفاظ بالنوافذ مفتوحة
    // await driver.quit();
  }
}

run();
