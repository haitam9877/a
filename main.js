const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const fs = require("fs");

// قراءة البيانات من الملف النصي وتحويلها إلى قائمة من الأشخاص
const users = fs
  .readFileSync("data.txt", "utf-8")
  .split("\n")
  .filter((line) => line.trim() !== "") // تجاهل الأسطر الفارغة
  .map((line) => {
    const [numeroWassit, numeroPieceIdentite] = line.split(",");
    return {
      numeroWassit: numeroWassit.trim(),
      numeroPieceIdentite: numeroPieceIdentite.trim(),
    };
  });

async function openTab(driver, index) {
  // فتح علامة تبويب جديدة
  await driver.executeScript("window.open();");
  const tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[tabs.length - 1]);

  // فتح الموقع في علامة التبويب الجديدة
  await driver.get("https://minha.anem.dz/pre_inscription"); // قم بتغيير الرابط إلى الرابط الفعلي

  // طباعة رسالة في الكونسول
  console.log(`Opened tab ${index + 1}`);
}

async function fillForm(driver, user, index) {
  // التبديل إلى التبويب المطلوب
  const tabs = await driver.getAllWindowHandles();
  await driver.switchTo().window(tabs[index + 1]);

  // طباعة رسالة في الكونسول
  console.log(`Filling form in tab ${index + 1}`);

  // تعبئة الحقل الأول
  await driver.findElement(By.id("numeroWassit")).sendKeys(user.numeroWassit);

  // تعبئة الحقل الثاني
  await driver
    .findElement(By.id("numeroPieceIdentite"))
    .sendKeys(user.numeroPieceIdentite);

  // الضغط على الزر الأول
  await driver.findElement(By.id("mui-5")).click();

  // الانتظار حتى يظهر الزر "تغيير موعد المقابلة" ثم الضغط عليه
  const changeAppointmentButton = await driver.wait(
    until.elementLocated(
      By.xpath("//button[contains(text(), 'تغيير موعد المقابلة')]")
    ),
    10000 // الانتظار لمدة 10 ثوانٍ كحد أقصى
  );

  // الضغط على الزر "تغيير موعد المقابلة"
  await changeAppointmentButton.click();

  // الانتظار حتى يظهر الشاك بوكس "agreeToPolicies"
  if (index === 0) {
    // الضغط على الشاك بوكس فقط في التبويب الأول
    const checkBox = await driver.wait(
      until.elementLocated(By.name("agreeToPolicies")),
      10000 // الانتظار لمدة 10 ثوانٍ كحد أقصى
    );

    // الضغط على الشاك بوكس
    await checkBox.click();
  }

  // هنا يمكنك إضافة أي إجراءات إضافية أخرى إذا لزم الأمر
}

async function run() {
  let driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(new chrome.Options())
    .build();

  try {
    // افتح علامة تبويب لكل شخص في القائمة
    for (let i = 0; i < users.length; i++) {
      await openTab(driver, i);
    }

    // بعد فتح جميع التبويبات، املأ النماذج في كل تبويب
    for (let i = 0; i < users.length; i++) {
      await fillForm(driver, users[i], i);
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
