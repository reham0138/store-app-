import { Outlet } from "react-router-dom";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
// import Button from "../components/Button";
// import { Input } from "../components/Input";
// import { Label } from "../components/Label";
// import { Select } from "../components/Select";

export default function MainLayout() {
  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <Outlet />
        {/* <section className="component-showcase" aria-label="نماذج المكونات">
          <div>
            <p className="component-showcase__eyebrow">واجهة المتجر</p>
            <h1>نماذج الحقول والأزرار</h1>
            <p className="component-showcase__description">
              مكونات جاهزة للاستخدام في نماذج تسجيل الدخول والمنتجات.
            </p>
          </div>

          <form
            className="component-showcase__form"
            onSubmit={(event) => {
              event.preventDefault();
              alert("تم إرسال النموذج");
            }}
          >
            <Label label="الاسم" required hint="اكتب اسمك الكامل">
              <Input name="name" placeholder="مثال: أحمد محمد" required />
            </Label>
            <Label label="البريد الإلكتروني" required>
              <Input
                name="email"
                type="email"
                placeholder="name@example.com"
                required
              />
            </Label>
            <Label label="نوع الحساب">
              <Select
                name="accountType"
                placeholder="اختر نوع الحساب"
                options={[
                  { value: "customer", label: "عميل" },
                  { value: "seller", label: "بائع" },
                ]}
              />
            </Label>
            <div className="button-showcase__actions">
              <Button
                type="submit"
                onClick={() => alert("تم الضغط على الزر الثانوي")}
              >
                حفظ البيانات
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => alert("تم الضغط على الزر الثانوي")}
              >
                إجراء ثانوي
              </Button>
              <Button
                type="button"
                variant="tertiary"
                onClick={() => alert("تم الضغط على الزر الثالث")}
              >
                إلغاء
              </Button>
            </div>
          </form>
        </section>
      </main> */}
      <Footer />
    </div>
  );
}
