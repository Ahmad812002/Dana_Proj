import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { LogOut, Plus, Users, Package, CheckCircle, XCircle, Clock, History, Settings } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export default function AdminDashboard({ user, onLogout, onSettings, onManageCompanies }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, ongoing: 0, completed: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [createCompanyOpen, setCreateCompanyOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedOrderHistory, setSelectedOrderHistory] = useState([]);
  const [newCompany, setNewCompany] = useState({
    username: "",
    password: "",
    company_name: "",
  });

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API}/orders`, getAuthHeader());
      setOrders(response.data);
    } catch (error) {
      toast.error("فشل في تحميل الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`, getAuthHeader());
      setStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const fetchOrderHistory = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}/history`, getAuthHeader());
      setSelectedOrderHistory(response.data);
      setHistoryOpen(true);
    } catch (error) {
      toast.error("فشل في تحميل سجل الطلب");
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/auth/register`,
        {
          ...newCompany,
          role: "company",
        },
        getAuthHeader()
      );
      toast.success("تم إنشاء حساب الشركة بنجاح");
      setCreateCompanyOpen(false);
      setNewCompany({ username: "", password: "", company_name: "" });
    } catch (error) {
      toast.error(error.response?.data?.detail || "فشل في إنشاء الحساب");
    }
  };

  const companies = [...new Set(orders.map((o) => o.company_name))];

  const filteredOrders = orders.filter((order) => {
    const matchCompany = filterCompany === "all" || order.company_name === filterCompany;
    const matchStatus = filterStatus === "all" || order.status === filterStatus;
    const matchSearch =
      searchQuery === "" ||
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery);
    return matchCompany && matchStatus && matchSearch;
  });

  const getStatusBadge = (status) => {
    const badges = {
      "جاري": { color: "bg-yellow-100 text-yellow-800", icon: <Clock className="w-4 h-4" /> },
      "تم": { color: "bg-green-100 text-green-800", icon: <CheckCircle className="w-4 h-4" /> },
      "ملغي": { color: "bg-red-100 text-red-800", icon: <XCircle className="w-4 h-4" /> },
    };
    const badge = badges[status] || badges["جاري"];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.icon}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-md border-b border-amber-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                VPerfumes
              </h1>
              <p className="text-sm text-gray-600 mt-1">لوحة التحكم - المدير</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold text-gray-800">{user.username}</p>
                <p className="text-xs text-gray-500">مدير النظام</p>
              </div>
              <Button
                onClick={onManageCompanies}
                data-testid="manage-companies-button"
                variant="outline"
                className="flex items-center gap-2 border-2 border-purple-200 hover:bg-purple-50"
              >
                <Users className="w-4 h-4" />
                إدارة الشركات
              </Button>
              <Button
                onClick={onSettings}
                data-testid="settings-button"
                variant="outline"
                className="flex items-center gap-2 border-2 border-purple-200 hover:bg-purple-50"
              >
                <Settings className="w-4 h-4" />
                الإعدادات
              </Button>
              <Button
                onClick={onLogout}
                data-testid="logout-button"
                variant="outline"
                className="flex items-center gap-2 border-2 border-purple-200 hover:bg-purple-50"
              >
                <LogOut className="w-4 h-4" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الطلبات</p>
                <p className="text-3xl font-bold text-purple-900">{stats.total}</p>
              </div>
              <Package className="w-12 h-12 text-purple-900 opacity-20" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">قيد التوصيل</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.ongoing}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">مكتمل</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 hover-lift">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ملغي</p>
                <p className="text-3xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-200/50 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Label className="mb-2 block text-gray-700 font-medium">بحث</Label>
              <Input
                data-testid="search-input"
                placeholder="رقم الطلب، اسم الزبون، رقم الهاتف"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-2 border-gray-200 focus:border-amber-400"
              />
            </div>
            <div className="min-w-[180px]">
              <Label className="mb-2 block text-gray-700 font-medium">الشركة</Label>
              <Select value={filterCompany} onValueChange={setFilterCompany}>
                <SelectTrigger data-testid="filter-company" className="border-2 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الشركات</SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company} value={company}>
                      {company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[150px]">
              <Label className="mb-2 block text-gray-700 font-medium">الحالة</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger data-testid="filter-status" className="border-2 border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="جاري">جاري</SelectItem>
                  <SelectItem value="تم">تم</SelectItem>
                  <SelectItem value="ملغي">ملغي</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={createCompanyOpen} onOpenChange={setCreateCompanyOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="create-company-button"
                  className="bg-gradient-to-r from-purple-900 to-purple-700 hover:from-purple-800 hover:to-purple-600 text-white shadow-lg"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  إضافة شركة
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl text-right">إنشاء حساب شركة جديدة</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateCompany} className="space-y-4 mt-4">
                  <div>
                    <Label>اسم الشركة</Label>
                    <Input
                      data-testid="company-name-input"
                      required
                      value={newCompany.company_name}
                      onChange={(e) => setNewCompany({ ...newCompany, company_name: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>اسم المستخدم</Label>
                    <Input
                      data-testid="company-username-input"
                      required
                      value={newCompany.username}
                      onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>كلمة المرور</Label>
                    <Input
                      data-testid="company-password-input"
                      type="password"
                      required
                      value={newCompany.password}
                      onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <Button type="submit" data-testid="submit-company-button" className="w-full">
                    إنشاء الحساب
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-amber-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="orders-table">
              <thead>
                <tr className="bg-gradient-to-r from-purple-900 to-purple-700 text-white">
                  <th className="px-4 py-4 text-right text-sm font-semibold">رقم الطلب</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">الشركة</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">اسم الزبون</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">رقم الهاتف</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">المنطقة</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">سعر الطلب</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">تكلفة التوصيل</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">الحالة</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">تاريخ الطلب</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-4 py-12 text-center text-gray-500">
                      لا توجد طلبات
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order, idx) => (
                    <tr
                      key={order.id}
                      data-testid={`order-row-${idx}`}
                      className="border-b border-gray-200 hover:bg-purple-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{order.order_number}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">
                          {order.company_name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{order.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600" dir="ltr">{order.customer_phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.delivery_area}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-purple-900">{order.order_price || 0} د.أ</td>
                      <td className="px-4 py-3 text-sm font-semibold text-gray-900">{order.delivery_cost} د.أ</td>
                      <td className="px-4 py-3 text-sm">{getStatusBadge(order.status)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{order.order_date}</td>
                      <td className="px-4 py-3 text-sm">
                        <Button
                          data-testid={`view-history-${idx}`}
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchOrderHistory(order.id)}
                          className="hover:bg-purple-100"
                        >
                          <History className="w-4 h-4 ml-1" />
                          السجل
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl text-right">سجل تعديلات الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedOrderHistory.length === 0 ? (
              <p className="text-center text-gray-500 py-8">لا يوجد سجل</p>
            ) : (
              selectedOrderHistory.map((entry, idx) => (
                <div
                  key={entry.id}
                  data-testid={`history-entry-${idx}`}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-900">{entry.username}</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {entry.action === "created" ? "أنشأ الطلب" : "عدّل الطلب"}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString("ar-EG")}
                    </span>
                  </div>
                  {entry.action === "updated" && Object.keys(entry.changes).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Object.entries(entry.changes).map(([key, value]) => (
                        <div key={key} className="text-sm bg-white p-2 rounded border border-gray-200">
                          <span className="font-medium text-gray-700">{key}:</span>
                          <span className="text-red-600 line-through mx-2">{JSON.stringify(value.old)}</span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600 mx-2">{JSON.stringify(value.new)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
