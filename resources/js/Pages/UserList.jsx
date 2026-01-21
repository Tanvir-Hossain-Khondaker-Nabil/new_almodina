import React, { useState } from "react";
import PageHeader from "../components/PageHeader";
import Image from "../components/Image";
import Pagination from "../components/Pagination";
import { Frown, Pen, Plus, Trash2, X } from "lucide-react";
import { Link, router, useForm, usePage } from "@inertiajs/react";
import axios from "axios";
import { useTranslation } from "../hooks/useTranslation";

export default function UserList({ users, filters }) {
    const { auth } = usePage().props;
    const { t, locale } = useTranslation();
    const [model, setModel] = useState(false);
    const [editProccesing, setEditProccesing] = useState(false);

    console.log("users", users);

    // model close handle
    const modelClose = () => {
        userForm.reset();
        setModel(!model);
    };

    // handle search
    const searchForm = useForm({
        search: filters.search || "",
    });
    const handleSearch = (e) => {
        const value = e.target.value;
        searchForm.setData("search", value);

        const queryString = value ? { search: value } : {};

        router.get(route("userlist.view"), queryString, {
            preserveScroll: true,
            preserveState: true,
            replace: true, // prevents pushing new history entry on every keystroke
        });
    };

    // handle edit
    const userForm = useForm({
        id: "",
        name: "",
        email: "",
        password: "",
        phone: "",
        address: "",
        role: "saller",
    });
    const handleUserCreateForm = (e) => {
        e.preventDefault();

        userForm.post(route("userlist.store"), {
            onSuccess: () => {
                userForm.reset();
                setModel(!model);
            },
        });
    };

    // handle user update
    const userEdithandle = (id) => {
        setEditProccesing(true);
        axios.get(route("userlist.edit", { id: id })).then((res) => {
            const data = res.data.data;
            userForm.setData("id", data.id);
            userForm.setData("name", data.name);
            userForm.setData("email", data.email);
            userForm.setData("phone", data.phone);
            userForm.setData("address", data.address);
            userForm.setData("role", data.role);
            setModel(true);
        });
        setEditProccesing(false);
    };

    return (
        <div className={`bg-white rounded-box p-5 ${locale === 'bn' ? 'bangla-font' : ''}`}>
            <PageHeader
                title={t('user.title', 'Users list')}
                subtitle={t('user.subtitle', 'Manage your all users from here.')}
            >
                <div className="flex items-center gap-3">
                    <input
                        type="search"
                        onChange={handleSearch}
                        value={searchForm.data.search}
                        placeholder={t('user.search_placeholder', 'Search..')}
                        className="input input-sm input-bordered"
                    />
                    <button
                        onClick={() => setModel(!model)}
                        className="btn bg-[#1e4d2b] text-white btn-sm"
                    >
                        <Plus size={15} /> {t('user.add_new', 'Add new')}
                    </button>
                </div>
            </PageHeader>

            <div className="overflow-x-auto">
                {users.data.length > 0 ? (
                    <table className="table table-auto w-full">
                        <thead className="bg-[#1e4d2b] text-white text-white">
                            <tr>
                                <th></th>
                                <th>{t('user.user', 'User')}</th>
                                <th>{t('user.email', 'Email')}</th>
                                <th>{t('user.role', 'Role')}</th>
                                <th>{t('user.address', 'Address')}</th>
                                <th>{t('user.join_at', 'Join at')}</th>
                                <th>{t('user.actions', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user, index) => (
                                <tr key={index}>
                                    <th>{index + 1}</th>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <Image
                                                path={user.avatar}
                                                className="rounded-full ring-1 rign-primary object-cover w-10 h-10"
                                            />
                                            <div>
                                                <p>{user.name}</p>
                                                <p>{user.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <a
                                            className="underline text-primary"
                                            href={`mailto:${user.email}`}
                                        >
                                            {user.email}
                                        </a>
                                    </td>
                                    <td>
                                        <div className={`badge ${user.role == "admin" ? "badge-info" : "badge-accent"} capitalize`}>
                                            {user.role === "admin" 
                                                ? t('user.admin', 'Admin')
                                                : t('user.saller', 'Seller')
                                            }
                                        </div>
                                    </td>
                                    <td>{user.address}</td>
                                    <td>{user.join_at}</td>
                                    <td>
                                        {user.id !== auth.id ? (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    disabled={editProccesing}
                                                    onClick={() => userEdithandle(user.id)}
                                                    className="btn btn-xs btn-info"
                                                >
                                                    <Pen size={10} /> {t('user.edit', 'Edit')}
                                                </button>
                                                <Link
                                                    href={route("userlist.delete", { id: user.id })}
                                                    onClick={(e) => {
                                                        if (!confirm(t('user.delete_confirmation', 'Are you sure you want to delete this user?'))) {
                                                            e.preventDefault();
                                                        }
                                                    }}
                                                    className="btn btn-xs btn-error"
                                                >
                                                    <Trash2 size={10} /> {t('user.delete', 'Delete')}
                                                </Link>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium text-gray-500">
                                                {t('user.this_is_you', 'This is you')}
                                            </p>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="border border-gray-200 rounded-box px-5 py-10 flex flex-col justify-center items-center gap-2">
                        <Frown size={20} className="text-gray-500" />
                        <h1 className="text-gray-500 text-sm">
                            {t('user.data_not_found', 'Data not found!')}
                        </h1>
                        <button
                            onClick={() => setModel(!model)}
                            className="btn bg-[#1e4d2b] text-white btn-sm"
                        >
                            <Plus size={15} /> {t('user.add_new', 'Add new')}
                        </button>
                    </div>
                )}
            </div>

            {/* pagination */}
            <Pagination data={users} />

            {/* user add && update model */}
            <dialog className="modal" open={model}>
                <div className="modal-box">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                        <h1 className="text-base font-medium text-gray-900">
                            {t('user.add_user', 'Add new user')}
                        </h1>
                        <button
                            onClick={modelClose}
                            className="btn btn-circle btn-xs btn-error"
                        >
                            <X size={10} />
                        </button>
                    </div>

                    <form onSubmit={handleUserCreateForm} className="space-y-2">
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('user.role', 'Role')}
                                <span className="text-red-500 ml-1">
                                    {t('user.required_field', '*')}
                                </span>
                            </legend>
                            <select
                                className="select select-bordered"
                                value={userForm.data.role}
                                onChange={(e) => userForm.setData("role", e.target.value)}
                            >
                                <option value="saller">{t('user.saller', 'Seller')}</option>
                                <option value="admin">{t('user.admin', 'Admin')}</option>
                            </select>
                            {userForm.errors.role && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.role}
                                </div>
                            )}
                        </fieldset>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('user.name', 'Name')}
                                    <span className="text-red-500 ml-1">
                                        {t('user.required_field', '*')}
                                    </span>
                                </legend>
                                <input
                                    type="text"
                                    value={userForm.data.name}
                                    onChange={(e) => userForm.setData("name", e.target.value)}
                                    className="input input-bordered"
                                    placeholder={t('user.name', 'Type here')}
                                />
                                {userForm.errors.name && (
                                    <div className="text-red-500 text-sm">
                                        {userForm.errors.name}
                                    </div>
                                )}
                            </fieldset>
                            <fieldset className="fieldset">
                                <legend className="fieldset-legend">
                                    {t('user.phone', 'Phone')}
                                </legend>
                                <input
                                    type="tel"
                                    value={userForm.data.phone}
                                    onChange={(e) => userForm.setData("phone", e.target.value)}
                                    className="input input-bordered"
                                    placeholder={t('user.phone', 'Type here')}
                                />
                                {userForm.errors.phone && (
                                    <div className="text-red-500 text-sm">
                                        {userForm.errors.phone}
                                    </div>
                                )}
                            </fieldset>
                        </div>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('user.email', 'Email')}
                                <span className="text-red-500 ml-1">
                                    {t('user.required_field', '*')}
                                </span>
                            </legend>
                            <input
                                type="email"
                                value={userForm.data.email}
                                onChange={(e) => userForm.setData("email", e.target.value)}
                                className="input input-bordered"
                                placeholder={t('user.email', 'Type here')}
                            />
                            {userForm.errors.email && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.email}
                                </div>
                            )}
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('user.password', 'Password')}
                                <span className="text-red-500 ml-1">
                                    {t('user.required_field', '*')}
                                </span>
                            </legend>
                            <input
                                type="password"
                                value={userForm.data.password}
                                onChange={(e) => userForm.setData("password", e.target.value)}
                                className="input input-bordered"
                                placeholder={t('user.password', 'Type here')}
                            />
                            {userForm.errors.password && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.password}
                                </div>
                            )}
                        </fieldset>
                        <fieldset className="fieldset">
                            <legend className="fieldset-legend">
                                {t('user.address', 'Address')}
                            </legend>
                            <textarea
                                className="textarea textarea-bordered"
                                value={userForm.data.address}
                                onChange={(e) => userForm.setData("address", e.target.value)}
                                placeholder={t('user.address', 'Type here')}
                            ></textarea>
                            {userForm.errors.address && (
                                <div className="text-red-500 text-sm">
                                    {userForm.errors.address}
                                </div>
                            )}
                        </fieldset>
                        <button
                            disabled={userForm.processing}
                            className="btn bg-[#1e4d2b] text-white"
                            type="submit"
                        >
                            {userForm.processing ? t('user.saving', 'Saving...') : t('user.add_now', 'Add now')}
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
}