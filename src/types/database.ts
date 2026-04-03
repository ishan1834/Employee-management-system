import { Database } from "./database.types" // Adjust path as needed

// Helper type to get a table's row structure
type PublicTableName = keyof Database["public"]["Tables"]

export type Tables<T extends PublicTableName> = Database["public"]["Tables"][T]["Row"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// --- Admin & Staff Types ---
export type Admin = Tables<"admins">
export type AdminRole = Admin["role"]
export type Attendance = Tables<"attendance">
export type AttendanceStatus = Attendance["status"]

// --- File & Communication Types ---
export type UploadedFile = Tables<"uploaded_files">
export type ChatMessage = Tables<"chat_messages">

// --- Analytics & Payments ---
export type AnalyticsData = Tables<"analytics_data">
export type PaymentVerification = Tables<"payment_verifications">

// --- Education & Career ---
export type Certificate = Tables<"certificates">
export type Internship = Tables<"internships">

// --- Gaming & Social Services ---
export type EsportsPlayer = Tables<"esports_players">
export type SocialMediaOrder = Tables<"social_media_orders">

// --- Trading & Stocks ---
export type TradingUser = Tables<"trading_users">
export type PlayerStock = Tables<"player_stocks">
export type TeamStock = Tables<"team_stocks">

// --- Betting ---
export type BettingEvent = Tables<"betting_events">

// --- Specific Insertion Types (Useful for Forms) ---
export type AdminInsert = Database["public"]["Tables"]["admins"]["Insert"]
export type AttendanceInsert = Database["public"]["Tables"]["attendance"]["Insert"]
export type ChatMessageInsert = Database["public"]["Tables"]["chat_messages"]["Insert"]
export type EsportsPlayerInsert = Database["public"]["Tables"]["esports_players"]["Insert"]
export type SocialMediaOrderInsert = Database["public"]["Tables"]["social_media_orders"]["Insert"]
