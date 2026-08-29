import {
    ArrowUpRight, BarChart3, CakeSlice, CheckCircle2, ChefHat, CircleDollarSign, Clock3, Inbox,
    PackageCheck, Plus, ShoppingBag, Sparkles, TrendingUp,
} from 'lucide-react';
import type { AdminData, Inquiry } from '../types';

type Props = {
    data: AdminData;
    openInquiry: (inquiry: Inquiry) => void;
    openInquiries: () => void;
    openProducts: () => void;
};

const labels = { new: 'New', contacted: 'Contacted', quoted: 'Quoted', confirmed: 'Confirmed', cancelled: 'Cancelled' };

export default function AdminOverview({ data, openInquiry, openInquiries, openProducts }: Props) {
    const statusCounts = ['new', 'contacted', 'quoted', 'confirmed'].map((status) => ({ status, count: data.inquiries.filter((inquiry) => inquiry.status === status).length }));
    const max = Math.max(1, ...statusCounts.map((item) => item.count));
    const handled = data.inquiries.filter((inquiry) => inquiry.status !== 'new' && inquiry.status !== 'cancelled').length;
    const readiness = data.inquiries.length ? Math.round((handled / data.inquiries.length) * 100) : 100;
    const stats = [
        { label: 'New inquiries', value: data.stats.new_inquiries, icon: Inbox, tone: 'berry', note: 'Need your attention', trend: '+12%' },
        { label: 'Active quotes', value: data.stats.active_quotes, icon: CircleDollarSign, tone: 'gold', note: 'Customer conversations', trend: 'Live' },
        { label: 'Confirmed', value: data.stats.confirmed, icon: PackageCheck, tone: 'green', note: 'Ready for production', trend: 'On track' },
        { label: 'Live products', value: data.stats.products, icon: CakeSlice, tone: 'brown', note: 'Visible in catalogue', trend: '100%' },
    ];

    return <>
        <section className="admin-welcome">
            <div className="welcome-copy">
                <span className="admin-live"><i />Storefront live</span>
                <p className="section-kicker">Sweet Boutique control room</p>
                <h2>The kitchen is in rhythm.</h2>
                <p>Customer requests, catalogue health and today’s next actions—beautifully organised in one place.</p>
                <div className="welcome-cta"><button onClick={openInquiries}><Inbox size={17} />Review inquiries<ArrowUpRight size={16} /></button><button onClick={openProducts}><Plus size={17} />Add a creation</button></div>
            </div>
            <div className="readiness-card">
                <div className="readiness-ring" style={{ '--readiness': `${readiness * 3.6}deg` } as React.CSSProperties}><span><b>{readiness}%</b><small>handled</small></span></div>
                <div><span>Service readiness</span><h3>{data.stats.new_inquiries ? `${data.stats.new_inquiries} request${data.stats.new_inquiries === 1 ? '' : 's'} waiting` : 'Everything is caught up'}</h3><p>Response queue is healthy and the catalogue is online.</p></div>
            </div>
        </section>

        <section className="stat-grid premium">{stats.map(({ label, value, icon: Icon, tone, note, trend }, index) => <article className={`stat-card ${tone}`} key={label}><div className="stat-top"><span><Icon size={19} /></span><i>{trend}</i></div><div><small>{label}</small><b>{value}</b><p>{note}</p></div><div className="mini-bars" aria-hidden="true">{[38, 56, 44, 68, 62, 82, 75].map((height, itemIndex) => <i key={itemIndex} style={{ height: `${Math.max(15, height - index * 5)}%` }} />)}</div></article>)}</section>

        <div className="overview-grid refined">
            <section className="dashboard-panel pipeline-panel"><div className="panel-heading"><div><span className="section-kicker">Live pipeline</span><h2>Inquiry momentum</h2></div><span className="panel-icon"><BarChart3 size={19} /></span></div><div className="pipeline-chart">{statusCounts.map((item, index) => <div key={item.status}><span className="bar-track"><i style={{ height: `${Math.max(12, item.count / max * 100)}%`, animationDelay: `${index * 90}ms` }} /></span><b>{item.count}</b><small>{labels[item.status as keyof typeof labels]}</small></div>)}</div><footer className="chart-footer"><TrendingUp size={16} /><span>Live counts update as the team moves inquiries forward.</span></footer></section>
            <section className="dashboard-panel recent-panel"><div className="panel-heading"><div><span className="section-kicker">Priority inbox</span><h2>Recent inquiries</h2></div><button onClick={openInquiries}>View all <ArrowUpRight size={15} /></button></div>{data.inquiries.slice(0, 5).map((inquiry) => <button className="recent-row" key={inquiry.id} onClick={() => openInquiry(inquiry)}><span className="avatar small">{inquiry.customer_name.slice(0, 2).toUpperCase()}</span><span><b>{inquiry.customer_name}</b><small>{inquiry.items[0]?.product_name || 'Custom request'}</small></span><span className={`status-badge ${inquiry.status}`}>{labels[inquiry.status]}</span><ArrowUpRight size={15} /></button>)}{data.inquiries.length === 0 && <div className="panel-empty"><Sparkles size={23} /><span>Your first inquiry will appear here.</span></div>}</section>
        </div>

        <section className="operations-ribbon">
            <div><span className="operation-icon warm"><ChefHat size={20} /></span><span><b>Kitchen focus</b><small>{data.stats.confirmed ? `${data.stats.confirmed} confirmed order${data.stats.confirmed === 1 ? '' : 's'} ready for planning` : 'No confirmed production waiting'}</small></span></div>
            <div><span className="operation-icon green"><CheckCircle2 size={20} /></span><span><b>Catalogue health</b><small>{data.stats.products} products are live and discoverable</small></span></div>
            <div><span className="operation-icon berry"><Clock3 size={20} /></span><span><b>Response target</b><small>Reply to new requests within 30 minutes</small></span></div>
            <button onClick={openInquiries}><ShoppingBag size={17} />Open workspace</button>
        </section>
    </>;
}
