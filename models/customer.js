"use strict";

const { SearchSource } = require("jest");
/** Customer for Lunchly */

const db = require("../db");
const { NotFoundError } = require("../expressError");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`
    );
    return results.rows.map((c) => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new NotFoundError(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }

  /** returns full name of customer */

  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** search for customer by name
   * -return array of matching customer instances
   */
  static async search(term) {

    const results = await db.query(
      `
    SELECT id, first_name, last_name, phone, notes
    FROM customers
    WHERE CONCAT (first_name, ' ', last_name) ilike $1`,
      [`%${term}%`]
    );


    return results.rows.map(
      (item) =>
        new Customer({
          id: item.id,
          firstName: item.first_name,
          lastName: item.last_name,
          phone: item.phone,
          notes: item.notes,
        })
    );


  }
  /** top 10 list of customers
   * -returns array of Customer instances
   */
  static async favorites() {
    const results = await db.query(`
    SELECT r.customer_id, COUNT(*), c.id, c.first_name, c.last_name, c.notes, c.phone
    FROM reservations r
    JOIN customers c
    ON c.id = r.customer_id
    GROUP BY r.customer_id, c.id
    ORDER BY COUNT(*) DESC
    LIMIT 10;`);

    return results.rows.map(
      (item) =>
        new Customer({
          id: item.id,
          firstName: item.first_name,
          lastName: item.last_name,
          phone: item.phone,
          notes: item.notes,
        })
    );

  }
}

module.exports = Customer;
