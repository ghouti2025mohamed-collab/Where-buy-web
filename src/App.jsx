import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Bell, MessageCircle, UserRound, Heart, MapPin, Plus, ShoppingBag,
  Sparkles, Menu, X, ChevronLeft, ChevronRight, ImagePlus, Video, Send,
  Phone, MoreHorizontal, Store, Package, ArrowUpRight, SlidersHorizontal,
  Check, LoaderCircle, Paperclip, ShieldCheck, PhoneCall,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

const CATEGORIES = ["الكل", "إلكترونيات", "ملابس", "إكسسوارات", "عطور", "المنزل", "رياضة"];
const DEMO_PRODUCTS = [
  { id: "demo-1", name: "سماعات لاسلكية Pro", description: "صوت نقي وبطارية تدوم طويلًا", category: "إلكترونيات", price: 8900, stock: 12, image_url: "", store: "متجر التقنية", store_phone: "0550 12 34 56", company_id: "demo-company-1", emoji: "🎧", color: "#eee8ff" },
  { id: "demo-2", name: "حذاء رياضي يومي", description: "خفيف ومريح للاستعمال اليومي", category: "ملابس", price: 6200, stock: 8, image_url: "", store: "Urban Shop", store_phone: "0661 45 23 10", company_id: "demo-company-2", emoji: "👟", color: "#ffe8e1" },
  { id: "demo-3", name: "ساعة ذكية Active", description: "متابعة النشاط والإشعارات", category: "إلكترونيات", price: 12500, stock: 5, image_url: "", store: "متجر التقنية", store_phone: "0550 12 34 56", company_id: "demo-company-1", emoji: "⌚", color: "#e2f2ff" },
  { id: "demo-4", name: "عطر رجالي Ocean", description: "رائحة منعشة وثبات جيد", category: "عطور", price: 4800, stock: 21, image_url: "", store: "Parfum DZ", store_phone: "0770 22 11 00", company_id: "demo-company-3", emoji: "🧴", color: "#e7f5ed" },
  { id: "demo-5", name: "حقيبة كتف عصرية", description: "تصميم بسيط ومساحة عملية", category: "إكسسوارات", price: 3500, stock: 14, image_url: "", store: "Urban Shop", store_phone: "0661 45 23 10", company_id: "demo-company-2", emoji: "👜", color: "#fff0d8" },
  { id: "demo-6", name: "مصباح مكتب LED", description: "إضاءة مريحة بثلاث درجات", category: "المنزل", price: 2700, stock: 19, image_url: "", store: "Home Plus", store_phone: "0555 90 80 70", company_id: "demo-company-4", emoji: "💡", color: "#fff3d9" },
];
const DEMO_STORIES = [
  { id: "s1", user_id: "demo-u1", name: "متجر التقنية", avatar: "ت", media_url: "", media_type: "image", isOwn: false },
  { id: "s2", user_id: "demo-u2", name: "Urban Shop", avatar: "U", media_url: "", media_type: "image", isOwn: false },
  { id: "s3", user_id: "demo-u3", name: "Parfum DZ", avatar: "P", media_url: "", media_type: "video", isOwn: false },
];
const money = (value) => `${Number(value || 0).toLocaleString("fr-FR")} دج`;
const initials = (name = "مستخدم") => String(name).trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase() || "م";
const getMediaType = (file) => file?.type?.startsWith("video/") ? "video" : "image";
function guessCategory(name = "") {
  const text = String(name);
  if (/سماعات|هاتف|جوال|ساعة ذكية|إلكترونيات|كمبيوتر|لابتوب|تلفاز|شاحن/i.test(text)) return "إلكترونيات";
  if (/حذاء|قميص|ملابس|حقيبة|بنطال|تيشيرت|جاكيت/i.test(text)) return "ملابس";
  if (/عطر|بارفان|parfum|perfume/i.test(text)) return "عطور";
  if (/حقيبة|ساعة|نظارة|محفظة|إكسسوار/i.test(text)) return "إكسسوارات";
  if (/مصباح|منزل|مطبخ|وسادة|كرسي|طاولة/i.test(text)) return "المنزل";
  if (/كرة|رياضة|سبور|sport|حذاء رياضي/i.test(text)) return "رياضة";
  return "إكسسوارات";
}
const fileExt = (file) => (file?.name?.split(".").pop() || (getMediaType(file) === "video" ? "mp4" : "jpg")).toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";

function Avatar({ name, url, size = "md", online = false }) {
  return <span className={`avatar avatar-${size} ${online ? "avatar-online" : ""}`}>{url ? <img src={url} alt={name || ""} /> : initials(name)}</span>;
}

function MediaPreview({ url, type, className = "" }) {
  if (!url) return <div className={`media-placeholder ${className}`}><ShoppingBag size={34} /><span>Where Buy</span></div>;
  return type === "video" ? <video className={className} src={url} controls playsInline /> : <img className={className} src={url} alt="وسائط المنشور" />;
}

export default function App() {
  const [session, setSession] = useState(null);
  const [productOpen, setProductOpen] = useState(false);
const [productName, setProductName] = useState("");
const [productDescription, setProductDescription] = useState("");
const [productPrice, setProductPrice] = useState("");
const [productStock, setProductStock] = useState("1");
const [productImage, setProductImage] = useState(null);
const [productPublishing, setProductPublishing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [activePage, setActivePage] = useState("home");
  const [products, setProducts] = useState(DEMO_PRODUCTS);
  const [stories, setStories] = useState(DEMO_STORIES);
  const [posts, setPosts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [authForm, setAuthForm] = useState({ full_name: "", phone: "", show_phone: false, email: "", password: "", role: "customer" });
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profileEditForm, setProfileEditForm] = useState({ full_name: "", phone: "", bio: "" });
  const [profileEditBusy, setProfileEditBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishForm, setPublishForm] = useState({ content: "", product_id: "" });
  const [publishFile, setPublishFile] = useState(null);
  const [publishBusy, setPublishBusy] = useState(false);
  const [storyFile, setStoryFile] = useState(null);
  const [storyBusy, setStoryBusy] = useState(false);
  const [storyOpen, setStoryOpen] = useState(null);
  const [productOpen, setProductOpen] = useState(null);
  const [profileTarget, setProfileTarget] = useState(null);
  const [profileProducts, setProfileProducts] = useState([]);
  const [profilePosts, setProfilePosts] = useState([]);
  const [profileCompany, setProfileCompany] = useState(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [chatFile, setChatFile] = useState(null);
  const [chatBusy, setChatBusy] = useState(false);
  const [callState, setCallState] = useState("idle");
  const [callType, setCallType] = useState("audio");
  const [callError, setCallError] = useState("");
  const [favorites, setFavorites] = useState([]);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const handlingSignalRef = useRef(false);
  const pendingIceCandidatesRef = useRef([]);
  const callStateRef = useRef("idle");
  const postFileRef = useRef(null);
  const storyFileRef = useRef(null);
  const chatFileRef = useRef(null);
  const [productOpen, setProductOpen] = useState(false);
const [productName, setProductName] = useState("");
const [productDescription, setProductDescription] = useState("");
const [productPrice, setProductPrice] = useState("");
const [productStock, setProductStock] = useState("1");
const [productImage, setProductImage] = useState(null);
const [productPublishing, setProductPublishing] = useState(false);

  useEffect(() => { callStateRef.current = callState; }, [callState]);

  const flash = useCallback((message) => {
    setNotice(message);
    window.clearTimeout(flash.timer);
    flash.timer = window.setTimeout(() => setNotice(""), 4200);
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!supabase) return;
    try {
      const [{ data: productRows, error: productError }, { data: companyRows }] = await Promise.all([
        supabase.from("products").select("id,name,description,price,image_url,stock,company_id,created_at").order("created_at", { ascending: false }),
        supabase.from("companies").select("id,name,address,phone,latitude,longitude,owner_id"),
      ]);
      if (productError) throw productError;
      const byId = Object.fromEntries((companyRows || []).map((row) => [String(row.id), row]));
      setCompanies(companyRows || []);
      setProducts((productRows || []).map((row) => {
        const company = byId[String(row.company_id)] || {};
        return { ...row, id: String(row.id), category: guessCategory(row.name), price: Number(row.price || 0), stock: Number(row.stock || 0), store: company.name || "متجر", store_phone: company.phone || "", store_address: company.address || "", owner_id: company.owner_id, emoji: "🛍️", color: "#f0edff" };
      }));
    } catch (error) {
      flash(`تعذر تحميل المنتجات: ${error.message || "تحقق من إعدادات قاعدة البيانات"}`);
    }
  }, [flash]);

  const loadSocial = useCallback(async () => {
    if (!supabase) return;
    try {
      const now = new Date().toISOString();
      const [{ data: postRows, error: postError }, { data: storyRows, error: storyError }] = await Promise.all([
        supabase.from("social_posts").select("*").order("created_at", { ascending: false }).limit(40),
        supabase.from("stories").select("*").gt("expires_at", now).order("created_at", { ascending: false }).limit(60),
      ]);
      if (postError) throw postError;
      if (storyError) throw storyError;
      const ids = [...new Set([...(postRows || []).map((x) => x.user_id), ...(storyRows || []).map((x) => x.user_id)])];
      const productIds = [...new Set((postRows || []).map((x) => x.product_id).filter(Boolean))];
      const [{ data: people }, { data: attachedProducts }] = await Promise.all([
        ids.length ? supabase.from("public_profiles").select("id,full_name,phone,avatar_url,bio,role").in("id", ids) : Promise.resolve({ data: [] }),
        productIds.length ? supabase.from("products").select("id,name,price,image_url,company_id").in("id", productIds) : Promise.resolve({ data: [] }),
      ]);
      const peopleById = Object.fromEntries((people || []).map((x) => [x.id, x]));
      const productsById = Object.fromEntries((attachedProducts || []).map((x) => [String(x.id), x]));
      setPosts((postRows || []).map((row) => ({ ...row, author: peopleById[row.user_id] || { full_name: "مستخدم Where Buy" }, product: productsById[String(row.product_id)] || null })));
      setStories((storyRows || []).map((row) => ({ ...row, author: peopleById[row.user_id] || { full_name: "مستخدم Where Buy" } })));
    } catch (error) {
      flash(`تعذر تحميل المنشورات: ${error.message || "خطأ غير معروف"}`);
    }
  }, [flash]);

  const loadMyProfile = useCallback(async (user) => {
    if (!supabase || !user) { setProfile(null); return; }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (error) { flash(`تعذر تحميل الملف الشخصي: ${error.message}`); return; }
    let current = data;
    if (!current) {
      const meta = user.user_metadata || {};
      const row = { id: user.id, full_name: meta.full_name || user.email?.split("@")[0] || "مستخدم", phone: meta.phone || null, role: meta.role || "customer" };
      const { data: created, error: createError } = await supabase.from("profiles").upsert(row, { onConflict: "id" }).select("*").single();
      if (createError) { flash(`تعذر إنشاء الملف الشخصي: ${createError.message}`); return; }
      current = created;
    }
    const { data: publicCard } = await supabase.from("public_profiles").select("full_name,phone,avatar_url,bio,role").eq("id", user.id).maybeSingle();
    setProfile({ ...current, avatar_url: publicCard?.avatar_url || current.avatar_url, bio: publicCard?.bio || current.bio, public_phone: publicCard?.phone || null });
    if (!publicCard) {
      const { error: publicError } = await supabase.from("public_profiles").upsert({ id: user.id, full_name: current.full_name || "مستخدم Where Buy", phone: user.user_metadata?.public_phone || null, role: current.role || "customer" }, { onConflict: "id" });
      if (publicError) flash(`تعذر إعداد الملف العام: ${publicError.message}`);
    }
  }, [flash]);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session || null);
      if (data.session?.user) await loadMyProfile(data.session.user);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (nextSession?.user) window.setTimeout(() => loadMyProfile(nextSession.user), 0);
      else { setProfile(null); setConversations([]); setSelectedConversation(null); }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, [loadMyProfile]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) { setFavorites([]); return; }
    let alive = true;
    supabase.from("favorites").select("product_id").eq("user_id", session.user.id).then(({ data, error }) => {
      if (!alive) return;
      if (!error) setFavorites((data || []).map((row) => String(row.product_id)));
    });
    return () => { alive = false; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!supabase) return;
    setLoading(true);
    Promise.all([loadCatalog(), loadSocial()]).finally(() => setLoading(false));
  }, [loadCatalog, loadSocial]);

  useEffect(() => {
    if (!supabase || !session?.user?.id) return;
    loadConversations();
    const channel = supabase.channel("wherebuy-social-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "social_posts" }, () => loadSocial())
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => loadSocial())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "الكل" || product.category === category;
    const text = `${product.name || ""} ${product.description || ""} ${product.store || ""}`.toLowerCase();
    return matchesCategory && text.includes(query.trim().toLowerCase());
  }), [products, category, query]);
async function signInOrUp(event) {
  event.preventDefault();

  if (!supabase) {
    flash("إعدادات Supabase غير مكتملة.");
    return;
  }

  setAuthBusy(true);

  try {
    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email.trim(),
        password: authForm.password,
        options: {
          data: {
            full_name: authForm.full_name.trim(),
            phone: authForm.phone.trim(),
            public_phone: authForm.show_phone
              ? authForm.phone.trim()
              : null,
            role: authForm.role,
          },
        },
      });

      if (error) throw error;

      if (data.user && data.session) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            full_name: authForm.full_name.trim(),
            phone: authForm.phone.trim(),
            role: authForm.role,
          }, { onConflict: "id" });

        if (profileError) throw profileError;

        const { error: publicError } = await supabase
          .from("public_profiles")
          .upsert({
            id: data.user.id,
            full_name: authForm.full_name.trim(),
            phone: authForm.show_phone
              ? authForm.phone.trim()
              : null,
            role: authForm.role,
          }, { onConflict: "id" });

        if (publicError) throw publicError;

        setSession(data.session);
        setAuthOpen(false);
        await loadMyProfile(data.user);
        flash("تم إنشاء حسابك بنجاح.");
      } else {
        flash("أرسلنا رابط تأكيد إلى بريدك الإلكتروني. أكّد الحساب ثم سجّل الدخول.");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authForm.email.trim(),
        password: authForm.password,
      });

      if (error) throw error;

      if (!data.session || !data.user) {
        throw new Error("لم يتم إنشاء جلسة تسجيل الدخول.");
      }

      setSession(data.session);
      setAuthOpen(false);
      setActivePage("home");

      await loadMyProfile(data.user);

      flash("مرحبًا بك في Where Buy.");
    }
  } catch (error) {
    flash(error.message || "تعذر إتمام العملية.");
  } finally {
    setAuthBusy(false);
  }
}


  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setActivePage("home");
    flash("تم تسجيل الخروج.");
  }

  async function uploadPublicMedia(file, folder) {
    const path = `${session.user.id}/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt(file)}`;
    const { error } = await supabase.storage.from("social-media").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from("social-media").getPublicUrl(path);
    return data.publicUrl;
  }
  async function getOrCreateMyCompany() {
  if (!session?.user?.id) {
    throw new Error("يجب تسجيل الدخول أولاً.");
  }

  const userId = session.user.id;

  const { data: existingCompany, error: findError } = await supabase
    .from("companies")
    .select("id, name, owner_id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (findError) throw findError;

  if (existingCompany) return existingCompany;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  const companyName =
    profile?.full_name ||
    session.user.email?.split("@")[0] ||
    "بائع Where Buy";

  const { data: newCompany, error: createError } = await supabase
    .from("companies")
    .insert({
      owner_id: userId,
      name: companyName,
      business_type: "individual"
    })
    .select("id, name, owner_id")
    .single();

  if (createError) throw createError;

  return newCompany;
}

  async function publishPost(event) {
    event.preventDefault();
    if (!session?.user) { setAuthOpen(true); return; }
    if (!publishForm.content.trim() && !publishFile && !publishForm.product_id) { flash("أضف نصًا أو صورة أو فيديو أو منتجًا قبل النشر."); return; }
    setPublishBusy(true);
    try {
      let mediaUrl = null; let mediaType = null;
      if (publishFile) { mediaUrl = await uploadPublicMedia(publishFile, "posts"); mediaType = getMediaType(publishFile); }
      const { error } = await supabase.from("social_posts").insert({ user_id: session.user.id, content: publishForm.content.trim() || null, media_url: mediaUrl, media_type: mediaType, product_id: publishForm.product_id || null });
      if (error) throw error;
      setPublishOpen(false); setPublishForm({ content: "", product_id: "" }); setPublishFile(null);
      await loadSocial(); flash("تم نشر منشورك بنجاح.");
    } catch (error) { flash(`تعذر النشر: ${error.message || "خطأ غير معروف"}`); }
    finally { setPublishBusy(false); }
  }
  async function publishProduct({
  name,
  description,
  price,
  stock,
  image,
}) {
  try {
    if (!session?.user?.id) {
      throw new Error("يجب تسجيل الدخول أولاً.");
    }

    if (!name?.trim()) {
      throw new Error("أدخل اسم المنتج.");
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      throw new Error("أدخل سعرًا صحيحًا.");
    }

    if (!Number.isInteger(numericStock) || numericStock < 0) {
      throw new Error("أدخل كمية مخزون صحيحة.");
    }

    const company = await getOrCreateMyCompany();

    let imageUrl = null;

    if (image) {
      imageUrl = await uploadPublicMedia(image, "products");
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        company_id: company.id,
        name: name.trim(),
        description: description?.trim() || null,
        price: numericPrice,
        stock: numericStock,
        image_url: imageUrl,
      })
      .select()
      .single();

    if (error) throw error;

    await loadCatalog();

    return data;
  } catch (error) {
    console.error("publishProduct:", error);
    throw error;
  }
}

  async function publishStory(event) {
    event.preventDefault();
    if (!session?.user) { setAuthOpen(true); return; }
    if (!storyFile) { flash("اختر صورة أو فيديو للستوري."); return; }
    setStoryBusy(true);
    try {
      const mediaUrl = await uploadPublicMedia(storyFile, "stories");
      const { error } = await supabase.from("stories").insert({ user_id: session.user.id, media_url: mediaUrl, media_type: getMediaType(storyFile), expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() });
      if (error) throw error;
      setStoryFile(null); await loadSocial(); flash("تم نشر قصتك لمدة 24 ساعة.");
    } catch (error) { flash(`تعذر نشر القصة: ${error.message || "خطأ غير معروف"}`); }
    finally { setStoryBusy(false); }
  }

  async function openProfile(userId) {
    if (!supabase) { flash("الملف الشخصي الكامل يظهر بعد ربط Supabase."); return; }
    setProfileTarget({ id: userId }); setProfileBusy(true); setActivePage("profile");
    try {
      const [{ data: person, error: personError }, { data: companyRows }, { data: postRows }] = await Promise.all([
        supabase.from("public_profiles").select("id,full_name,phone,avatar_url,bio,role").eq("id", userId).maybeSingle(),
        supabase.from("companies").select("id,name,address,phone,description,owner_id").eq("owner_id", userId).limit(1),
        supabase.from("social_posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30),
      ]);
      if (personError) throw personError;
      const company = companyRows?.[0] || null;
      let userProducts = [];
      if (company?.id) {
        const { data, error } = await supabase.from("products").select("id,name,description,price,image_url,stock,company_id,created_at").eq("company_id", company.id).order("created_at", { ascending: false });
        if (error) throw error;
        userProducts = data || [];
      }
      const productIds = [...new Set((postRows || []).map((row) => row.product_id).filter(Boolean))];
      const { data: attached } = productIds.length ? await supabase.from("products").select("id,name,price,image_url,company_id").in("id", productIds) : { data: [] };
      const attachedById = Object.fromEntries((attached || []).map((x) => [String(x.id), x]));
      setProfileTarget({ ...(person || { id: userId, full_name: "مستخدم Where Buy" }), company });
      setProfileCompany(company);
      setProfileProducts(userProducts.map((item) => ({ ...item, category: guessCategory(item.name), store: company?.name || "متجر", store_phone: company?.phone || person?.phone || "" })));
      setProfilePosts((postRows || []).map((row) => ({ ...row, author: person, product: attachedById[String(row.product_id)] || null })));
    } catch (error) { flash(`تعذر فتح الملف الشخصي: ${error.message || "خطأ غير معروف"}`); }
    finally { setProfileBusy(false); }
  }

  async function savePublicProfile(event) {
    event.preventDefault();
    if (!session?.user || !supabase) return;
    setProfileEditBusy(true);
    try {
      const { error } = await supabase.from("public_profiles").upsert({
        id: session.user.id,
        full_name: profileEditForm.full_name.trim() || "مستخدم Where Buy",
        phone: profileEditForm.phone.trim() || null,
        bio: profileEditForm.bio.trim() || null,
        role: profile?.role || "customer",
      }, { onConflict: "id" });
      if (error) throw error;
      await loadMyProfile(session.user);
      await openProfile(session.user.id);
      setProfileEditOpen(false);
      flash("تم تحديث معلومات صفحتك العامة.");
    } catch (error) { flash(`تعذر تحديث الملف: ${error.message || "خطأ غير معروف"}`); }
    finally { setProfileEditBusy(false); }
  }

  async function loadConversations() {
    if (!supabase || !session?.user?.id) return;
    try {
      const id = session.user.id;
      const { data, error } = await supabase.from("conversations").select("*").or(`member_one.eq.${id},member_two.eq.${id}`).order("updated_at", { ascending: false });
      if (error) throw error;
      const otherIds = (data || []).map((row) => row.member_one === id ? row.member_two : row.member_one);
      const { data: people } = otherIds.length ? await supabase.from("public_profiles").select("id,full_name,phone,avatar_url").in("id", otherIds) : { data: [] };
      const map = Object.fromEntries((people || []).map((person) => [person.id, person]));
      setConversations((data || []).map((row) => ({ ...row, other: map[row.member_one === id ? row.member_two : row.member_one] || { full_name: "مستخدم" } })));
    } catch (error) { flash(`تعذر تحميل المحادثات: ${error.message || "خطأ غير معروف"}`); }
  }

  async function startConversation(targetUser) {
    if (!session?.user) { setAuthOpen(true); return; }
    if (!targetUser?.id || targetUser.id === session.user.id) { flash("لا يمكنك بدء محادثة مع حسابك."); return; }
    if (!supabase) return;
    try {
      const { data, error } = await supabase.rpc("create_direct_conversation", { other_user_id: targetUser.id });
      if (error) throw error;
      await loadConversations();
      const conversation = { id: data, other: targetUser };
      setSelectedConversation(conversation); setActivePage("messages");
    } catch (error) { flash(`تعذر بدء المحادثة: ${error.message || "طبّق ترحيل قاعدة البيانات أولًا"}`); }
  }

  const loadMessages = useCallback(async (conversationId) => {
    if (!supabase || !conversationId) return;
    const { data, error } = await supabase.from("messages").select("*").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(150);
    if (error) { flash(`تعذر تحميل الرسائل: ${error.message}`); return; }
    const ready = await Promise.all((data || []).map(async (message) => {
      if (!message.media_path) return message;
      const { data: signed, error: signedError } = await supabase.storage.from("chat-media").createSignedUrl(message.media_path, 60 * 60);
      return { ...message, media_url: signedError ? null : signed?.signedUrl };
    }));
    setMessages(ready);
  }, [flash]);

  useEffect(() => {
    if (!selectedConversation?.id || !supabase) return;
    loadMessages(selectedConversation.id);
    const channel = supabase.channel(`messages-${selectedConversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConversation.id}` }, () => loadMessages(selectedConversation.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedConversation?.id, loadMessages]);

  async function sendMessage(event) {
    event?.preventDefault?.();
    if (!session?.user || !selectedConversation?.id) { flash("اختر محادثة أولًا."); return; }
    if (!messageText.trim() && !chatFile) return;
    setChatBusy(true);
    try {
      let mediaPath = null; let mediaType = null;
      if (chatFile) {
        mediaType = getMediaType(chatFile);
        mediaPath = `${selectedConversation.id}/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt(chatFile)}`;
        const { error } = await supabase.storage.from("chat-media").upload(mediaPath, chatFile, { contentType: chatFile.type || "application/octet-stream", upsert: false });
        if (error) throw error;
      }
      const { error } = await supabase.from("messages").insert({ conversation_id: selectedConversation.id, sender_id: session.user.id, body: messageText.trim() || null, media_path: mediaPath, media_type: mediaType });
      if (error) throw error;
      setMessageText(""); setChatFile(null); await loadMessages(selectedConversation.id);
      loadConversations();
    } catch (error) { flash(`تعذر إرسال الرسالة: ${error.message || "خطأ غير معروف"}`); }
    finally { setChatBusy(false); }
  }

  async function createPeerConnection(type = callType) {
    if (!selectedConversation?.id) throw new Error("اختر محادثة قبل الاتصال.");
    const peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }] });
    peerRef.current = peer;
    peer.onicecandidate = async (event) => {
      if (event.candidate) await sendCallSignal("ice", event.candidate.toJSON());
    };
    peer.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) { remoteStreamRef.current = stream; if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream; }
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(peer.connectionState)) setCallState((old) => old === "idle" ? old : "connecting");
      if (peer.connectionState === "connected") setCallState("active");
    };
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === "video" });
    localStreamRef.current = stream;
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return peer;
  }

  async function sendCallSignal(kind, payload) {
    if (!supabase || !selectedConversation?.id || !session?.user?.id) return;
    const { error } = await supabase.from("call_signals").insert({ conversation_id: selectedConversation.id, sender_id: session.user.id, event_type: kind, payload: payload || {} });
    if (error) flash(`تعذر إرسال إشارة المكالمة: ${error.message}`);
  }

  async function handleCallSignal(row) {
    if (!row || row.sender_id === session?.user?.id || handlingSignalRef.current) return;
    handlingSignalRef.current = true;
    try {
      if (row.event_type === "offer") {
        if (callStateRef.current !== "idle") return;
        const incomingType = row.payload?.callType === "video" ? "video" : "audio";
        const accept = window.confirm(`مكالمة ${incomingType === "video" ? "مرئية" : "صوتية"} واردة. هل تريد الرد؟`);
        if (!accept) { await sendCallSignal("reject", {}); return; }
        setCallType(incomingType); setCallState("connecting");
        const peer = await createPeerConnection(incomingType);
        await peer.setRemoteDescription(new RTCSessionDescription(row.payload.description));
        for (const candidate of pendingIceCandidatesRef.current.splice(0)) { try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {} }
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        await sendCallSignal("answer", { description: peer.localDescription.toJSON() });
      } else if (row.event_type === "answer" && peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(row.payload.description));
        for (const candidate of pendingIceCandidatesRef.current.splice(0)) { try { await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {} }
      } else if (row.event_type === "ice" && row.payload) {
        if (peerRef.current?.remoteDescription) {
          try { await peerRef.current.addIceCandidate(new RTCIceCandidate(row.payload)); } catch (_) {}
        } else { pendingIceCandidatesRef.current.push(row.payload); }
      } else if (["hangup", "reject"].includes(row.event_type)) {
        cleanupCall(); flash(row.event_type === "reject" ? "لم يتم قبول المكالمة." : "انتهت المكالمة.");
      }
    } catch (error) {
      cleanupCall(); setCallError(error.message || "تعذر بدء المكالمة.");
    } finally { handlingSignalRef.current = false; }
  }

  useEffect(() => {
    if (!selectedConversation?.id || !supabase || !session?.user?.id) return;
    const channel = supabase.channel(`call-signals-${selectedConversation.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "call_signals", filter: `conversation_id=eq.${selectedConversation.id}` }, ({ new: row }) => handleCallSignal(row))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation?.id, session?.user?.id]);

  async function startCall(type) {
    if (!selectedConversation?.id) { flash("اختر محادثة قبل الاتصال."); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) { flash("المتصفح لا يدعم المكالمات. استخدم HTTPS ومتصفحًا حديثًا."); return; }
    setCallError(""); setCallType(type); setCallState("connecting");
    try {
      // Re-create using the selected media type before requesting camera/microphone.
      const peer = await createPeerConnection(type);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      await sendCallSignal("offer", { description: peer.localDescription.toJSON(), callType: type });
    } catch (error) { cleanupCall(); setCallError(error.message || "لم نتمكن من تشغيل الكاميرا أو الميكروفون."); flash(error.message || "تعذر بدء المكالمة."); }
  }

  function cleanupCall() {
    pendingIceCandidatesRef.current = [];
    if (peerRef.current) { peerRef.current.ontrack = null; peerRef.current.onicecandidate = null; peerRef.current.close(); peerRef.current = null; }
    [localStreamRef.current, remoteStreamRef.current].forEach((stream) => stream?.getTracks?.().forEach((track) => track.stop()));
    localStreamRef.current = null; remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setCallState("idle");
  }

  async function endCall() {
    if (callState !== "idle") await sendCallSignal("hangup", {});
    cleanupCall();
  }

  useEffect(() => () => cleanupCall(), []);

  function openMessages() {
    if (!session?.user) { setAuthOpen(true); return; }
    setActivePage("messages"); loadConversations();
  }

  async function toggleFavorite(productId) {
    if (!session?.user) { setAuthOpen(true); return; }
    const next = favorites.includes(String(productId)) ? favorites.filter((x) => x !== String(productId)) : [...favorites, String(productId)];
    setFavorites(next);
    // Persist favorites in the existing Where Buy table when its policies are enabled.
    try {
      if (next.includes(String(productId))) {
        const { error } = await supabase.from("favorites").insert({ user_id: session.user.id, product_id: productId });
        if (error && !String(error.code).includes("23505")) throw error;
      } else {
        const { error } = await supabase.from("favorites").delete().eq("user_id", session.user.id).eq("product_id", productId);
        if (error) throw error;
      }
    } catch (error) { flash(`لم تتم مزامنة المفضلة: ${error.message}`); }
  }

  const isDemo = !isSupabaseConfigured;
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="القائمة" onClick={() => setActivePage("home")}><Menu /></button>
        <button className="brand" onClick={() => setActivePage("home")}>
          <span className="brand-mark"><ShoppingBag size={23} strokeWidth={2.5} /></span>
          <span className="brand-word">Where <b>Buy</b><small>اكتشف. قارن. تواصل.</small></span>
        </button>
        <div className="header-search"><Search size={19} /><input value={query} onChange={(e) => { setQuery(e.target.value); setActivePage("home"); }} placeholder="عن ماذا تبحث ؟؟" /><kbd>⌘ K</kbd></div>
        <nav className="top-actions">
          <button className={`icon-button ${activePage === "messages" ? "selected" : ""}`} title="الرسائل" onClick={openMessages}><MessageCircle /><span>الرسائل</span></button>
          <button className="icon-button" title="الإشعارات" onClick={() => flash("لا توجد إشعارات جديدة.")}><Bell /><span>الإشعارات</span></button>
          {session?.user ? <button className="profile-chip" onClick={() => openProfile(session.user.id)}><Avatar name={profile?.full_name || session.user.email} url={profile?.avatar_url} /><span>{profile?.full_name || "حسابي"}</span></button> : <button className="login-button" onClick={() => { setAuthMode("login"); setAuthOpen(true); }}>تسجيل الدخول</button>}
        </nav>
      </header>

      {isDemo && <div className="demo-banner"><Sparkles size={16} /> أنت تشاهد معاينة تفاعلية. اربط Supabase لتفعيل الحسابات والنشر والمحادثات والمكالمات وحفظ البيانات.</div>}

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar-card primary-nav">
            <p className="side-caption">القائمة الرئيسية</p>
            <SideButton icon={<ShoppingBag />} label="الرئيسية" active={activePage === "home"} onClick={() => setActivePage("home")} />
            <SideButton icon={<MessageCircle />} label="الرسائل" active={activePage === "messages"} onClick={openMessages} />
            <SideButton icon={<Heart />} label="المفضلة" active={activePage === "favorites"} onClick={() => setActivePage("favorites")} />
            <SideButton icon={<UserRound />} label="ملفي الشخصي" active={activePage === "profile"} onClick={() => session?.user ? openProfile(session.user.id) : setAuthOpen(true)} />
          </div>
          <div className="sidebar-card category-nav">
            <div className="side-heading"><p className="side-caption">التصنيفات</p><SlidersHorizontal size={16} /></div>
            {CATEGORIES.map((item) => <button key={item} className={`category-link ${category === item ? "active" : ""}`} onClick={() => { setCategory(item); setActivePage("home"); }}><span className="category-dot" />{item}</button>)}
          </div>
          <div className="sidebar-promo"><div className="promo-icon"><Sparkles /></div><b>منتجك يستحق أن يُرى</b><p>انشر منتجاتك، شارك قصصك، وتواصل مع عملائك مباشرة.</p><button onClick={() => session?.user ? setPublishOpen(true) : setAuthOpen(true)}>ابدأ النشر <ArrowUpRight size={15} /></button></div>
          <div className="sidebar-footer"><span>© 2026 Where Buy</span><span>صنع بحب في الجزائر</span></div>
        </aside>

        <main className="main-content">
          {activePage === "home" && <>
            <section className="welcome-row"><div><span className="eyebrow">سوقك في مكان واحد</span><h1>اكتشف ما تبحث عنه <span>بسهولة.</span></h1><p>منتجات قريبة منك، متاجر موثوقة، وتواصل مباشر مع البائع.</p></div><button className="publish-main" onClick={() => session?.user ? setPublishOpen(true) : setAuthOpen(true)}><Plus size={18} /> إنشاء منشور</button></section>
            <section className="stories-section">
              <div className="section-heading"><div><h2>القصص اليومية</h2><p>شاهد آخر ما نشرته المتاجر والمستخدمون</p></div><span className="live-label"><i /> نشطة الآن</span></div>
              <div className="stories-strip">
                <form className="story-add" onSubmit={publishStory}>
                  <button type="button" className="story-add-circle" onClick={() => session?.user ? storyFileRef.current?.click() : setAuthOpen(true)}><Plus size={24} /></button>
                  <b>قصتك</b><small>أضف قصة</small>
                  <input ref={storyFileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => { setStoryFile(e.target.files?.[0] || null); }} />
                  {storyFile && <button className="story-send" type="submit" disabled={storyBusy}>{storyBusy ? "..." : "نشر"}</button>}
                </form>
                {stories.map((story, index) => <button className="story-item" key={story.id} onClick={() => setStoryOpen(story)}><span className={`story-ring ring-${index % 4}`}><Avatar name={story.author?.full_name || story.name || "متجر"} url={story.author?.avatar_url} size="lg" /></span><b>{story.author?.full_name || story.name || "متجر"}</b></button>)}
                {stories.length === 0 && <div className="story-empty">لا توجد قصص جديدة الآن.</div>}
              </div>
            </section>

            <section className="products-section">
              <div className="section-heading product-heading"><div><h2>منتجات تستحق اكتشافك</h2><p>تصفح أحدث المنتجات المنشورة من المتاجر</p></div><button className="text-link" onClick={() => { setCategory("الكل"); setQuery(""); }}>عرض الكل <ChevronLeft size={17} /></button></div>
              <div className="filter-row">{CATEGORIES.map((item) => <button key={item} className={`filter-pill ${category === item ? "active" : ""}`} onClick={() => setCategory(item)}>{item}</button>)}</div>
              <div className="product-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} isFavorite={favorites.includes(String(product.id))} onFavorite={() => toggleFavorite(product.id)} onPress={() => setProductOpen(product)} onStore={() => product.owner_id && openProfile(product.owner_id)} />)}</div>
              {visibleProducts.length === 0 && <EmptyState title="لم نعثر على منتجات" body="جرّب كلمة بحث أخرى أو اختر تصنيفًا مختلفًا." />}
              {loading && <div className="loading-row"><LoaderCircle className="spin" /> جارٍ تحديث المنتجات...</div>}
            </section>

            <section className="feed-section">
              <div className="section-heading"><div><h2>من مجتمع Where Buy</h2><p>آخر المنشورات من البائعين والمستخدمين</p></div><button className="outline-button" onClick={() => session?.user ? setPublishOpen(true) : setAuthOpen(true)}><Plus size={16} /> شارك منشورًا</button></div>
              {posts.length === 0 ? <EmptyState title="كن أول من ينشر اليوم" body="شارك منتجًا أو صورة أو فيديو مع مجتمع Where Buy." action="إنشاء منشور" onAction={() => session?.user ? setPublishOpen(true) : setAuthOpen(true)} /> : <div className="feed-list">{posts.slice(0, 8).map((post) => <PostCard key={post.id} post={post} onProfile={() => openProfile(post.user_id)} onProduct={() => post.product && setProductOpen(post.product)} onMessage={() => startConversation(post.author)} />)}</div>}
            </section>
          </>}

          {activePage === "profile" && <ProfilePage target={profileTarget} company={profileCompany} products={profileProducts} posts={profilePosts} loading={profileBusy} own={profileTarget?.id === session?.user?.id} onBack={() => setActivePage("home")} onProduct={setProductOpen} onMessage={() => startConversation(profileTarget)} onPublish={() => setPublishOpen(true)} onEdit={() => { setProfileEditForm({ full_name: profileTarget?.full_name || "", phone: profileTarget?.phone || "", bio: profileTarget?.bio || "" }); setProfileEditOpen(true); }} />}

          {activePage === "messages" && <section className="messages-page">
            <div className="messages-title"><div><span className="eyebrow">تواصل مباشر</span><h1>رسائلك</h1><p>تحدث مع المتاجر والمستخدمين وشارك الصور والفيديوهات.</p></div><span className="messages-secure"><ShieldCheck size={17} /> محادثات خاصة</span></div>
            {!session?.user ? <EmptyState title="سجّل الدخول لعرض رسائلك" body="تحتاج إلى حساب حتى تبدأ محادثات خاصة مع البائعين." action="تسجيل الدخول" onAction={() => setAuthOpen(true)} /> : <div className="chat-layout">
              <aside className="conversation-list"><div className="conversation-head"><b>المحادثات</b><button className="icon-button small" onClick={loadConversations}><MoreHorizontal /></button></div>{conversations.length === 0 ? <div className="chat-empty">لا توجد محادثات بعد.<small>افتح منتجًا واضغط «راسل البائع» لبدء محادثة.</small></div> : conversations.map((item) => <button key={item.id} className={`conversation-item ${selectedConversation?.id === item.id ? "active" : ""}`} onClick={() => setSelectedConversation(item)}><Avatar name={item.other?.full_name} url={item.other?.avatar_url} /><span><b>{item.other?.full_name || "مستخدم"}</b><small>{item.other?.phone || "محادثة مباشرة"}</small></span><ChevronLeft size={16} /></button>)}</aside>
              <div className="chat-window">{selectedConversation ? <>
                <div className="chat-top"><div className="chat-person"><Avatar name={selectedConversation.other?.full_name} url={selectedConversation.other?.avatar_url} online /><span><b>{selectedConversation.other?.full_name || "مستخدم"}</b><small>محادثة خاصة</small></span></div><div className="chat-tools"><button title="مكالمة صوتية" onClick={() => startCall("audio")}><Phone size={18} /></button><button title="مكالمة مرئية" onClick={() => startCall("video")}><Video size={19} /></button></div></div>
                <div className="messages-scroll">{messages.length === 0 && <div className="chat-first-message">ابدأ المحادثة برسالة ترحيب 👋</div>}{messages.map((message) => <div key={message.id} className={`message-row ${message.sender_id === session.user.id ? "mine" : "theirs"}`}><div className="message-bubble">{message.body && <p>{message.body}</p>}{message.media_url && <MediaPreview url={message.media_url} type={message.media_type} className="chat-media" />}<time>{new Date(message.created_at).toLocaleTimeString("ar-DZ", { hour: "2-digit", minute: "2-digit" })}</time></div></div>)}</div>
                <form className="chat-compose" onSubmit={sendMessage}><input ref={chatFileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => setChatFile(e.target.files?.[0] || null)} /><button type="button" className="attach-button" title="إرفاق صورة أو فيديو" onClick={() => chatFileRef.current?.click()}><Paperclip size={20} /></button><input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="اكتب رسالتك هنا..." /><button type="submit" disabled={chatBusy || (!messageText.trim() && !chatFile)} className="send-button"><Send size={18} /></button></form>
                {chatFile && <div className="selected-file"><span>{chatFile.name}</span><button onClick={() => setChatFile(null)}><X size={14} /></button></div>}
              </> : <div className="chat-placeholder"><div><MessageCircle size={34} /><b>اختر محادثة</b><p>ستظهر رسائلك هنا بمجرد اختيار محادثة من القائمة.</p></div></div>}</div>
            </div>}
          </section>}

          {activePage === "favorites" && <section className="products-section"><div className="section-heading"><div><span className="eyebrow">قائمتك الخاصة</span><h1>المنتجات المفضلة</h1><p>المنتجات التي حفظتها للعودة إليها لاحقًا.</p></div></div>{!session?.user ? <EmptyState title="سجّل الدخول لحفظ المفضلة" body="أنشئ حسابًا حتى تبقى منتجاتك المفضلة محفوظة." action="تسجيل الدخول" onAction={() => setAuthOpen(true)} /> : <div className="product-grid">{products.filter((p) => favorites.includes(String(p.id))).map((product) => <ProductCard key={product.id} product={product} isFavorite onFavorite={() => toggleFavorite(product.id)} onPress={() => setProductOpen(product)} />)}</div>}</section>}
        </main>

        <aside className="right-rail">
          <div className="rail-card search-assist"><div className="assist-icon"><Sparkles size={21} /></div><span className="eyebrow">بحث أذكى</span><h3>صف لنا ما تريد</h3><p>اكتب اسم المنتج أو وصفه، وساعدك Where Buy في العثور عليه.</p><div className="assist-search"><Search size={17} /><input value={query} onChange={(e) => { setQuery(e.target.value); setActivePage("home"); }} placeholder="مثال: سماعات بلوتوث..." /></div><button onClick={() => setActivePage("home")}>ابحث الآن <ArrowUpRight size={15} /></button></div>
          <div className="rail-card popular-card"><div className="rail-title"><h3>الأكثر تصفحًا</h3><span>هذا الأسبوع</span></div>{products.slice(0, 4).map((item, index) => <button className="popular-item" key={item.id} onClick={() => setProductOpen(item)}><span className="popular-number">0{index + 1}</span><span className="popular-product"><b>{item.name}</b><small>{item.store}</small></span><span className="popular-price">{money(item.price)}</span></button>)}</div>
          <div className="rail-card help-card"><div className="help-icon"><ShieldCheck size={19} /></div><div><b>تسوق بثقة</b><p>تأكد من تفاصيل المنتج وتواصل مع البائع قبل إتمام الشراء.</p></div></div>
        </aside>
      </div>

      {notice && <div className="toast"><Check size={17} />{notice}<button onClick={() => setNotice("")}><X size={15} /></button></div>}

      {authOpen && <Modal onClose={() => setAuthOpen(false)}><div className="auth-modal"><div className="modal-brand"><span className="brand-mark"><ShoppingBag /></span><h2>{authMode === "login" ? "مرحبًا بعودتك" : "انضم إلى Where Buy"}</h2><p>{authMode === "login" ? "سجّل الدخول لمتابعة اكتشاف المنتجات والتواصل." : "أنشئ حسابك وابدأ البيع أو التسوق."}</p></div><form onSubmit={signInOrUp} className="stack-form">{authMode === "signup" && <><label>الاسم الكامل<input required value={authForm.full_name} onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })} placeholder="اسمك الكامل" /></label><label>رقم الهاتف<input required value={authForm.phone} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} placeholder="05 / 06 / 07 ..." /></label><label className="phone-consent"><input type="checkbox" checked={authForm.show_phone} onChange={(e) => setAuthForm({ ...authForm, show_phone: e.target.checked })} /> أوافق على عرض رقم هاتفي في صفحتي العامة</label><label>نوع الحساب<select value={authForm.role} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value })}><option value="customer">مشتري</option><option value="store">بائع / متجر</option></select></label></>}<label>البريد الإلكتروني<input type="email" required value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="name@example.com" /></label><label>كلمة المرور<input type="password" minLength={6} required value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="6 أحرف على الأقل" /></label><button className="primary-submit" disabled={authBusy}>{authBusy ? "جارٍ المعالجة..." : authMode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}</button></form><p className="auth-switch">{authMode === "login" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"} <button onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}>{authMode === "login" ? "أنشئ حسابًا" : "سجّل الدخول"}</button></p></div></Modal>}

      {publishOpen && <Modal onClose={() => setPublishOpen(false)}><div className="publish-modal"><div className="modal-heading"><div><span className="eyebrow">شارك مجتمعك</span><h2>إنشاء منشور جديد</h2></div><button className="icon-button" onClick={() => setPublishOpen(false)}><X /></button></div><form onSubmit={publishPost}><div className="composer-user"><Avatar name={profile?.full_name} url={profile?.avatar_url} /><div><b>{profile?.full_name || "حسابي"}</b><small>سيكون منشورك ظاهرًا للمجتمع</small></div></div><textarea value={publishForm.content} onChange={(e) => setPublishForm({ ...publishForm, content: e.target.value })} placeholder="ماذا تريد أن تشارك اليوم؟" rows={4} /><input ref={postFileRef} type="file" accept="image/*,video/*" hidden onChange={(e) => setPublishFile(e.target.files?.[0] || null)} />{publishFile && <div className="selected-file"><span>{publishFile.name}</span><button type="button" onClick={() => setPublishFile(null)}><X size={14} /></button></div>}<div className="composer-tools"><button type="button" onClick={() => postFileRef.current?.click()}><ImagePlus size={18} /> صورة أو فيديو</button><label><Package size={18} /> إرفاق منتج<select value={publishForm.product_id} onChange={(e) => setPublishForm({ ...publishForm, product_id: e.target.value })}><option value="">بدون منتج</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — {money(product.price)}</option>)}</select></label></div><button className="primary-submit" disabled={publishBusy}>{publishBusy ? "جارٍ النشر..." : "نشر الآن"}</button></form></div></Modal>}

      {productOpen && <Modal onClose={() => setProductOpen(null)}><div className="product-modal"><button className="modal-close icon-button" onClick={() => setProductOpen(null)}><X /></button><div className="product-modal-media"><MediaPreview url={productOpen.image_url} type="image" /></div><div className="product-modal-info"><span className="eyebrow">تفاصيل المنتج</span><h2>{productOpen.name}</h2><div className="product-modal-price">{money(productOpen.price)}</div><p>{productOpen.description || "تواصل مع البائع لمعرفة المزيد من التفاصيل."}</p><div className="seller-mini"><Avatar name={productOpen.store || "المتجر"} /><div><b>{productOpen.store || "متجر Where Buy"}</b><small>{productOpen.stock > 0 ? `متوفر · ${productOpen.stock} قطعة` : "تحقق من التوفر مع البائع"}</small></div>{productOpen.owner_id && <button className="text-link" onClick={() => { setProductOpen(null); openProfile(productOpen.owner_id); }}>الملف الشخصي</button>}</div>{productOpen.store_phone && <div className="phone-line"><Phone size={16} /><a href={`tel:${productOpen.store_phone}`}>{productOpen.store_phone}</a></div>}<div className="product-modal-actions"><button className="primary-submit" onClick={() => { const owner = companies.find((c) => String(c.id) === String(productOpen.company_id)); setProductOpen(null); if (owner?.owner_id) startConversation({ id: owner.owner_id, full_name: owner.name }); else flash("لا يوجد حساب مرتبط بهذا المتجر للمراسلة."); }}><MessageCircle size={17} /> راسل البائع</button><button className="outline-button" onClick={() => toggleFavorite(productOpen.id)}><Heart size={17} /> حفظ</button></div></div></div></Modal>}

      {profileEditOpen && <Modal onClose={() => setProfileEditOpen(false)}><div className="publish-modal"><div className="modal-heading"><div><span className="eyebrow">ملفك العام</span><h2>تعديل معلومات الصفحة</h2></div><button className="icon-button" onClick={() => setProfileEditOpen(false)}><X /></button></div><form className="stack-form" onSubmit={savePublicProfile}><label>الاسم الظاهر<input value={profileEditForm.full_name} onChange={(e) => setProfileEditForm({ ...profileEditForm, full_name: e.target.value })} /></label><label>رقم الهاتف الظاهر للزوار<input value={profileEditForm.phone} onChange={(e) => setProfileEditForm({ ...profileEditForm, phone: e.target.value })} placeholder="اتركه فارغًا لإخفائه" /></label><label>نبذة قصيرة<textarea rows={3} value={profileEditForm.bio} onChange={(e) => setProfileEditForm({ ...profileEditForm, bio: e.target.value })} placeholder="عرّف الناس بك أو بمتجرك..." /></label><p className="privacy-hint">رقم الهاتف هنا يصبح ظاهرًا للمستخدمين المسجلين. لا تضع رقمًا لا ترغب في مشاركته.</p><button className="primary-submit" disabled={profileEditBusy}>{profileEditBusy ? "جارٍ الحفظ..." : "حفظ التغييرات"}</button></form></div></Modal>}

      {storyOpen && <div className="story-viewer" onClick={() => setStoryOpen(null)}><button className="story-close"><X /></button><div className="story-viewer-content" onClick={(e) => e.stopPropagation()}><div className="story-viewer-head"><Avatar name={storyOpen.author?.full_name || storyOpen.name} url={storyOpen.author?.avatar_url} /><b>{storyOpen.author?.full_name || storyOpen.name || "قصة"}</b><span>· قبل قليل</span></div>{storyOpen.media_url ? <MediaPreview url={storyOpen.media_url} type={storyOpen.media_type} className="story-media" /> : <div className="story-demo"><Sparkles size={38} /><b>قصة من Where Buy</b><span>أضف إعدادات Supabase لعرض الوسائط.</span></div>}</div></div>}

      {callState !== "idle" && <div className="call-overlay"><div className="call-card"><div className="call-card-top"><span className="call-pulse"><PhoneCall size={18} /></span><div><b>{callType === "video" ? "مكالمة مرئية" : "مكالمة صوتية"}</b><small>{callState === "active" ? "تم الاتصال" : "جارٍ الاتصال..."}</small></div><button className="icon-button" onClick={endCall}><X /></button></div><div className="call-video-stage"><video ref={remoteVideoRef} autoPlay playsInline className={callType === "video" ? "remote-video" : "audio-video-hidden"} /><video ref={localVideoRef} autoPlay muted playsInline className={callType === "video" ? "local-video" : "audio-video-hidden"} />{callType === "audio" && <div className="audio-call-avatar"><Avatar name={selectedConversation?.other?.full_name} size="xl" /><b>{selectedConversation?.other?.full_name || "جهة الاتصال"}</b><span>اتصال صوتي مباشر</span></div>}</div>{callError && <p className="call-error">{callError}</p>}<button className="hangup-button" onClick={endCall}><Phone size={19} /> إنهاء المكالمة</button><small className="call-note">تحتاج المكالمات إلى HTTPS وإذن الكاميرا والميكروفون. جودة الاتصال تعتمد على الشبكة وإعداد TURN.</small></div></div>}
    </div>
  );
}

function SideButton({ icon, label, active, onClick }) {
  return <button className={`side-button ${active ? "active" : ""}`} onClick={onClick}>{icon}<span>{label}</span>{active && <i />}</button>;
}

function ProductCard({ product, isFavorite, onFavorite, onPress, onStore = () => {} }) {
  return <article className="product-card"><div className="product-card-image" role="button" tabIndex={0} onClick={onPress} onKeyDown={(e) => e.key === "Enter" && onPress()}>{product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="product-art" style={{ background: product.color || "#eeeaff" }}><span>{product.emoji || "🛍️"}</span><small>WHERE BUY</small></div>}<button className={`favorite-toggle ${isFavorite ? "active" : ""}`} onClick={(e) => { e.stopPropagation(); onFavorite(); }} aria-label="إضافة للمفضلة"><Heart size={18} fill={isFavorite ? "currentColor" : "none"} /></button>{product.stock <= 0 && <span className="out-stock">نفد المخزون</span>}</div><div className="product-card-content"><button className="store-link" onClick={onStore}><Store size={13} />{product.store || "متجر"}</button><button className="product-title" onClick={onPress}>{product.name}</button><p>{product.description || "منتج جديد من متاجر Where Buy"}</p><div className="product-bottom"><b>{money(product.price)}</b><button onClick={onPress} aria-label="عرض المنتج"><ArrowUpRight size={17} /></button></div></div></article>;
}

function PostCard({ post, onProfile, onProduct, onMessage }) {
  return <article className="post-card"><div className="post-author"><button onClick={onProfile} className="author-button"><Avatar name={post.author?.full_name} url={post.author?.avatar_url} /><span><b>{post.author?.full_name || "مستخدم Where Buy"}</b><small>{new Date(post.created_at).toLocaleString("ar-DZ", { dateStyle: "medium", timeStyle: "short" })}</small></span></button><button className="icon-button small"><MoreHorizontal /></button></div>{post.content && <p className="post-content">{post.content}</p>}{post.media_url && <MediaPreview url={post.media_url} type={post.media_type} className="post-media" />}{post.product && <button className="attached-product" onClick={onProduct}><span className="attached-product-image">{post.product.image_url ? <img src={post.product.image_url} alt="" /> : "🛍️"}</span><span><small>منتج مرفق</small><b>{post.product.name}</b><strong>{money(post.product.price)}</strong></span><ChevronLeft size={18} /></button>}<div className="post-actions"><button onClick={onProfile}><UserRound size={16} /> الملف الشخصي</button><button onClick={onMessage}><MessageCircle size={16} /> مراسلة</button></div></article>;
}

function ProfilePage({ target, company, products, posts, loading, own, onBack, onProduct, onMessage, onPublish, onEdit }) {
  if (loading) return <div className="profile-loading"><LoaderCircle className="spin" /> جارٍ تحميل الملف الشخصي...</div>;
  if (!target) return <EmptyState title="لم يتم اختيار ملف شخصي" body="عد إلى الرئيسية واختر أحد البائعين." action="الرئيسية" onAction={onBack} />;
  const phone = company?.phone || target.phone;
  return <section className="profile-page"><button className="back-link" onClick={onBack}><ChevronRight size={17} /> العودة</button><div className="profile-cover"><div className="cover-orbit orbit-one" /><div className="cover-orbit orbit-two" /><span className="cover-tag"><ShieldCheck size={14} /> مجتمع Where Buy</span></div><div className="profile-main-card"><div className="profile-main-top"><Avatar name={target.full_name} url={target.avatar_url} size="2xl" /><div className="profile-identity"><h1>{company?.name || target.full_name || "مستخدم Where Buy"}</h1><span>{company ? "متجر / بائع" : target.role === "store" ? "بائع" : "عضو في Where Buy"}</span><p>{company?.description || target.bio || "مرحبًا بك في صفحتي على Where Buy."}</p></div><div className="profile-actions">{own ? <div className="profile-actions-stack"><button className="outline-button" onClick={onEdit}>تعديل معلومات الصفحة</button><button className="publish-main" onClick={onPublish}><Plus size={17} /> نشر منشور</button></div> : <button className="publish-main" onClick={onMessage}><MessageCircle size={17} /> مراسلة</button>}</div></div><div className="profile-contact"><span><Phone size={16} /> {phone || "لم يضف رقم هاتف"}</span>{company?.address && <span><MapPin size={16} /> {company.address}</span>}<span><Package size={16} /> {products.length} منتج منشور</span></div></div><div className="profile-tabs"><span className="active">المنتجات</span><span>المنشورات ({posts.length})</span></div><div className="section-heading profile-products-heading"><div><h2>منتجات {company?.name || target.full_name}</h2><p>كل المنتجات التي نشرها صاحب هذه الصفحة</p></div></div>{products.length ? <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} isFavorite={false} onFavorite={() => {}} onPress={() => onProduct(product)} />)}</div> : <EmptyState title="لا توجد منتجات منشورة بعد" body="عندما ينشر صاحب الحساب منتجاته ستظهر هنا." />}{posts.length > 0 && <><div className="section-heading"><div><h2>منشورات الصفحة</h2></div></div><div className="feed-list">{posts.map((post) => <PostCard key={post.id} post={post} onProfile={() => {}} onProduct={() => post.product && onProduct(post.product)} onMessage={onMessage} />)}</div></>}</section>;
}

function EmptyState({ title, body, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><ShoppingBag size={25} /></span><b>{title}</b><p>{body}</p>{action && <button className="outline-button" onClick={onAction}>{action}</button>}</div>;
}

function Modal({ children, onClose }) {
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal-card">{children}</div></div>;
}
